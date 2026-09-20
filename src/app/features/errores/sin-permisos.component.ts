import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';

/** Se muestra cuando el token es valido pero no trae el rol que exige la ruta. */
@Component({
  selector: 'app-sin-permisos',
  imports: [RouterLink],
  template: `
    <section class="panel" style="max-width: 560px; margin: 3rem auto; text-align: center">
      <h1>403 &middot; Sin permisos</h1>
      <p class="texto-suave">
        Tu sesion es valida, pero tu token no incluye el rol necesario para esta seccion.
      </p>
      <p>
        Roles de tu token:
        <strong>{{ auth.roles().join(', ') || 'ninguno' }}</strong>
      </p>
      <p class="texto-suave" style="font-size: 0.82rem">
        Pide a un administrador que te asigne el rol de aplicacion correspondiente en
        Microsoft Entra ID y vuelve a iniciar sesion para refrescar el token.
      </p>
      <a class="boton" routerLink="/">Volver al inicio</a>
    </section>
  `,
})
export class SinPermisosComponent {
  protected readonly auth = inject(AuthService);
}
