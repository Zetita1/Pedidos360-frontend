import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from './auth.service';

/**
 * Guard de autorizacion por rol. Se aplica despues del MsalGuard: cuando ya hay sesion,
 * revisa el claim {@code roles} del token antes de mostrar la vista.
 *
 * @param rolesRequeridos roles que habilitan la ruta
 */
export function rolGuard(rolesRequeridos: string[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (auth.tieneAlgunRol(rolesRequeridos)) {
      return true;
    }
    return router.createUrlTree(['/sin-permisos']);
  };
}

/**
 * Redirige la raiz a la vista de inicio que corresponde al rol: el tablero para quienes
 * gestionan y el listado propio para el rol Pedidos.Cliente.
 */
export const inicioGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return router.createUrlTree([auth.puedeGestionar() ? '/tablero' : '/mis-pedidos']);
};
