import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptors, withInterceptorsFromDi } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import {
  MSAL_GUARD_CONFIG,
  MSAL_INSTANCE,
  MSAL_INTERCEPTOR_CONFIG,
  MsalBroadcastService,
  MsalGuard,
  MsalInterceptor,
  MsalService,
} from '@azure/msal-angular';
import { firstValueFrom } from 'rxjs';

import { routes } from './app.routes';
import {
  MSALGuardConfigFactory,
  MSALInstanceFactory,
  MSALInterceptorConfigFactory,
} from './core/auth/msal.config';
import { errorInterceptor } from './core/interceptors/error.interceptor';

/**
 * MSAL v5+ exige inicializar la instancia y procesar la respuesta del redirect antes de que
 * arranque el router; de lo contrario el guard no encuentra la cuenta recien autenticada.
 */
function inicializarMsal(): Promise<void> {
  const msal = inject(MsalService);

  return firstValueFrom(msal.initialize())
    .then(() => firstValueFrom(msal.handleRedirectObservable()))
    .then((resultado) => {
      const cuenta = resultado?.account ?? msal.instance.getAllAccounts()[0];
      if (cuenta) {
        msal.instance.setActiveAccount(cuenta);
      }
    })
    .catch((error) => {
      console.error('No fue posible inicializar MSAL', error);
    });
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),

    // withInterceptorsFromDi habilita el MsalInterceptor (basado en clase);
    // withInterceptors agrega el manejo funcional de errores.
    provideHttpClient(withInterceptorsFromDi(), withInterceptors([errorInterceptor])),

    { provide: MSAL_INSTANCE, useFactory: MSALInstanceFactory },
    { provide: MSAL_GUARD_CONFIG, useFactory: MSALGuardConfigFactory },
    { provide: MSAL_INTERCEPTOR_CONFIG, useFactory: MSALInterceptorConfigFactory },
    { provide: HTTP_INTERCEPTORS, useClass: MsalInterceptor, multi: true },
    MsalService,
    MsalGuard,
    MsalBroadcastService,

    provideAppInitializer(inicializarMsal),
  ],
};
