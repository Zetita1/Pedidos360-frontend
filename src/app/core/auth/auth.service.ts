import { Injectable, computed, inject, signal } from '@angular/core';
import { MsalBroadcastService, MsalService } from '@azure/msal-angular';
import {
  AccountInfo,
  AuthenticationResult,
  EventMessage,
  EventType,
  InteractionStatus,
} from '@azure/msal-browser';
import { filter, firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';

/** Roles de aplicacion definidos en el registro de la API en Microsoft Entra ID. */
export const ROLES = {
  admin: 'Pedidos.Admin',
  vendedor: 'Pedidos.Vendedor',
  cliente: 'Pedidos.Cliente',
} as const;

/** Claims relevantes del id token / access token de Entra ID. */
interface ClaimsEntraId {
  name?: string;
  preferred_username?: string;
  oid?: string;
  tid?: string;
  roles?: string[];
  scp?: string;
  exp?: number;
}

/**
 * Concentra el estado de sesion del SPA: cuenta activa, roles y scopes leidos desde los
 * claims del token. Ninguna vista lee MSAL directamente.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly msal = inject(MsalService);
  private readonly broadcast = inject(MsalBroadcastService);

  private readonly cuenta = signal<AccountInfo | null>(null);
  private readonly interaccion = signal<InteractionStatus>(InteractionStatus.Startup);

  /**
   * Claims del access token emitido para la API.
   *
   * Los roles de aplicacion estan definidos en el registro de la API, asi que solo viajan
   * en el token cuya audiencia es esa API. El ID token —cuya audiencia es el SPA— no los
   * trae. Por eso la identidad se lee del ID token y la autorizacion del access token.
   */
  private readonly claimsApi = signal<ClaimsEntraId>({});

  /** true mientras MSAL esta procesando un login, logout o renovacion. */
  readonly ocupado = computed(() => this.interaccion() !== InteractionStatus.None);

  readonly autenticado = computed(() => this.cuenta() !== null);

  readonly claims = computed<ClaimsEntraId>(
    () => (this.cuenta()?.idTokenClaims as ClaimsEntraId | undefined) ?? {},
  );

  readonly nombre = computed(
    () => this.claims().name ?? this.claims().preferred_username ?? 'Usuario',
  );

  readonly email = computed(() => this.claims().preferred_username ?? '');

  readonly usuarioId = computed(() => this.claims().oid ?? this.claimsApi().oid ?? '');

  readonly roles = computed(() => this.claimsApi().roles ?? this.claims().roles ?? []);

  readonly scopes = computed(() =>
    (this.claimsApi().scp ?? this.claims().scp ?? '').split(' ').filter(Boolean),
  );

  readonly esAdmin = computed(() => this.roles().includes(ROLES.admin));

  readonly esVendedor = computed(() => this.roles().includes(ROLES.vendedor));

  readonly puedeGestionar = computed(() => this.esAdmin() || this.esVendedor());

  constructor() {
    this.sincronizarCuenta();

    this.broadcast.inProgress$.subscribe((estado) => {
      this.interaccion.set(estado);
      if (estado === InteractionStatus.None) {
        this.sincronizarCuenta();
      }
    });

    // Tras un login se piden los claims de la API una sola vez.
    this.broadcast.msalSubject$
      .pipe(filter((evento: EventMessage) => evento.eventType === EventType.LOGIN_SUCCESS))
      .subscribe(() => {
        this.sincronizarCuenta();
        void this.refrescarClaimsDeApi();
      });

    // Cada vez que MSAL obtiene o renueva un token para la API, sus claims vienen en el
    // propio evento: se leen de ahi. Volver a pedir el token desde este punto emitiria otro
    // ACQUIRE_TOKEN_SUCCESS y entraria en un bucle infinito.
    this.broadcast.msalSubject$
      .pipe(filter((evento: EventMessage) => evento.eventType === EventType.ACQUIRE_TOKEN_SUCCESS))
      .subscribe((evento) => {
        const resultado = evento.payload as AuthenticationResult | null;
        if (resultado?.accessToken && AuthService.esTokenDeLaApi(resultado)) {
          this.claimsApi.set(AuthService.decodificarPayload(resultado.accessToken));
        }
      });
  }

  /** true si el token fue emitido para alguno de los scopes de la API de Pedidos360. */
  private static esTokenDeLaApi(resultado: AuthenticationResult): boolean {
    return resultado.scopes.some((scope) =>
      environment.apiScopes.some((propio) => propio.toLowerCase() === scope.toLowerCase()),
    );
  }

  /** Inicia sesion contra el IDaaS mediante redirect, solicitando los scopes de la API. */
  iniciarSesion(): void {
    this.msal.loginRedirect({
      scopes: ['openid', 'profile', 'offline_access', ...environment.apiScopes],
    });
  }

  /** Cierra la sesion en el SPA y en el IDaaS. */
  cerrarSesion(): void {
    this.msal.logoutRedirect({
      postLogoutRedirectUri: environment.msal.postLogoutRedirectUri,
    });
  }

  /**
   * Indica si el usuario tiene alguno de los roles indicados.
   *
   * @param rolesRequeridos roles aceptados por la ruta u accion
   */
  tieneAlgunRol(rolesRequeridos: string[]): boolean {
    if (rolesRequeridos.length === 0) {
      return true;
    }
    const propios = this.roles();
    return rolesRequeridos.some((rol) => propios.includes(rol));
  }

  /** Vencimiento del token en hora local, util para mostrarlo en la vista de perfil. */
  vencimientoToken(): Date | null {
    const exp = this.claimsApi().exp ?? this.claims().exp;
    return exp ? new Date(exp * 1000) : null;
  }

  /**
   * Pide en silencio el access token de la API y guarda sus claims, que son los que traen
   * los roles y los scopes. Se llama al arrancar y cada vez que MSAL emite un token nuevo.
   *
   * @returns promesa que se resuelve cuando los claims estan disponibles
   */
  async refrescarClaimsDeApi(): Promise<void> {
    const cuenta = this.msal.instance.getActiveAccount() ?? this.msal.instance.getAllAccounts()[0];
    if (!cuenta) {
      this.claimsApi.set({});
      return;
    }

    try {
      const resultado = await firstValueFrom(
        this.msal.acquireTokenSilent({ scopes: environment.apiScopes, account: cuenta }),
      );
      this.claimsApi.set(AuthService.decodificarPayload(resultado.accessToken));
    } catch (error) {
      // Sin token de API el usuario queda sin roles: el backend respondera 403 igual.
      console.warn('No fue posible obtener el access token de la API', error);
      this.claimsApi.set({});
    }
  }

  /**
   * Lee el payload de un JWT sin verificarlo. La verificacion criptografica la hacen el
   * API Gateway y el backend; aqui solo se usa para decidir que mostrar en pantalla.
   *
   * @param jwt token en formato compacto
   * @return claims del payload
   */
  private static decodificarPayload(jwt: string): ClaimsEntraId {
    try {
      const payload = jwt.split('.')[1];
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const binario = atob(base64);
      const bytes = Uint8Array.from(binario, (caracter) => caracter.charCodeAt(0));
      return JSON.parse(new TextDecoder().decode(bytes)) as ClaimsEntraId;
    } catch {
      return {};
    }
  }

  private sincronizarCuenta(): void {
    const cuentas = this.msal.instance.getAllAccounts();
    if (cuentas.length === 0) {
      this.cuenta.set(null);
      return;
    }
    const actual = this.msal.instance.getActiveAccount();
    const activa = actual ?? cuentas[0];
    if (!actual) {
      // setActiveAccount emite ACTIVE_ACCOUNT_CHANGED: solo se llama si de verdad cambia.
      this.msal.instance.setActiveAccount(activa);
    }
    this.cuenta.set(activa);
  }
}
