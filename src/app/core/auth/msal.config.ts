import {
  BrowserCacheLocation,
  IPublicClientApplication,
  InteractionType,
  LogLevel,
  PublicClientApplication,
} from '@azure/msal-browser';
import {
  MsalGuardConfiguration,
  MsalInterceptorConfiguration,
} from '@azure/msal-angular';

import { environment } from '../../../environments/environment';

/**
 * Instancia de MSAL apuntando al tenant externo (CIAM) de Microsoft Entra External ID.
 *
 * MSAL Browser v5 implementa unicamente "Authorization Code Flow con PKCE": genera el
 * code_verifier, envia code_challenge con S256 y valida state y nonce. No hay que activar
 * nada: el flujo implicito ya no existe en la libreria.
 */
export function MSALInstanceFactory(): IPublicClientApplication {
  return new PublicClientApplication({
    auth: {
      clientId: environment.msal.clientId,
      authority: environment.msal.authority,
      // Obligatorio para autoridades que no son login.microsoftonline.com.
      knownAuthorities: environment.msal.knownAuthorities,
      redirectUri: environment.msal.redirectUri,
      postLogoutRedirectUri: environment.msal.postLogoutRedirectUri,
    },
    cache: {
      // sessionStorage evita que la sesion quede viva en equipos compartidos del taller.
      cacheLocation: BrowserCacheLocation.SessionStorage,
    },
    system: {
      loggerOptions: {
        logLevel: environment.production ? LogLevel.Error : LogLevel.Warning,
        piiLoggingEnabled: false,
        loggerCallback: (level, message, containsPii) => {
          if (containsPii) {
            return;
          }
          if (level === LogLevel.Error) {
            console.error('[MSAL]', message);
          } else if (!environment.production) {
            console.debug('[MSAL]', message);
          }
        },
      },
    },
  });
}

/**
 * Configuracion del MsalGuard: si la ruta esta protegida y no hay sesion, se redirige al
 * flujo de usuario del IDaaS pidiendo los scopes de la API.
 */
export function MSALGuardConfigFactory(): MsalGuardConfiguration {
  return {
    interactionType: InteractionType.Redirect,
    authRequest: {
      scopes: ['openid', 'profile', 'offline_access', ...environment.apiScopes],
    },
    loginFailedRoute: '/login-fallido',
  };
}

/**
 * Configuracion del MsalInterceptor: adjunta el access token a toda llamada dirigida al
 * API Gateway y renueva el token en silencio cuando expira.
 *
 * La clave cubre tanto las rutas por microservicio (/api/v1/...) como las del BFF
 * (/api/bff/...). En desarrollo apiBaseUrl es vacio, asi que la clave queda relativa y
 * MSAL la resuelve contra el origen del SPA, donde responde el proxy de ng serve.
 */
export function MSALInterceptorConfigFactory(): MsalInterceptorConfiguration {
  const protectedResourceMap = new Map<string, Array<string> | null>();
  protectedResourceMap.set(`${environment.apiBaseUrl}/api/*`, environment.apiScopes);

  return {
    interactionType: InteractionType.Redirect,
    protectedResourceMap,
  };
}
