import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { NotificacionesService } from '../services/notificaciones.service';

/**
 * Traduce los Problem Detail que devuelve el backend a mensajes para el usuario y reacciona
 * a los codigos de seguridad: 401 significa token invalido o vencido, 403 falta de rol.
 */
export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  const notificaciones = inject(NotificacionesService);
  const router = inject(Router);

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      const detalle = error.error?.detail ?? error.error?.title;

      switch (error.status) {
        case 0:
          notificaciones.error('No fue posible contactar al API Gateway. Revisa que el backend este arriba.');
          break;
        case 401:
          notificaciones.error('Tu sesion expiro o el token no es valido. Vuelve a iniciar sesion.');
          break;
        case 403:
          notificaciones.error(detalle ?? 'No tienes permisos para realizar esta accion.');
          void router.navigate(['/sin-permisos']);
          break;
        case 404:
          notificaciones.error(detalle ?? 'El recurso solicitado no existe.');
          break;
        case 409:
          notificaciones.error(detalle ?? 'La operacion no cumple una regla de negocio.');
          break;
        case 400:
          notificaciones.error(detalle ?? 'Revisa los datos enviados.');
          break;
        default:
          notificaciones.error(detalle ?? 'Ocurrio un error inesperado.');
      }

      return throwError(() => error);
    }),
  );
};
