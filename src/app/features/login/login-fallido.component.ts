import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';

/** Ruta a la que el MsalGuard deriva cuando el login con el IDaaS no prospera. */
@Component({
  selector: 'app-login-fallido',
  imports: [RouterLink],
  template: `
    <section class="panel" style="max-width: 520px; margin: 3rem auto; text-align: center">
      <h1>No pudimos iniciar tu sesion</h1>
      <p class="texto-suave">
        El IDaaS rechazo la autenticacion o el usuario cancelo el proceso. Verifica que tu
        cuenta pertenezca al tenant de la organizacion y vuelve a intentarlo.
      </p>
      <button type="button" class="boton" (click)="reintentar()">Reintentar</button>
      <p style="margin-top: 1rem"><a routerLink="/login">Volver al inicio</a></p>
    </section>
  `,
})
export class LoginFallidoComponent {
  private readonly auth = inject(AuthService);

  protected reintentar(): void {
    this.auth.iniciarSesion();
  }
}
