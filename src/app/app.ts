import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from './core/auth/auth.service';
import { NotificacionesService } from './core/services/notificaciones.service';

/** Shell de la aplicacion: barra de navegacion segun rol, avisos y salida del router. */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly auth = inject(AuthService);
  protected readonly notificaciones = inject(NotificacionesService);

  protected cerrarSesion(): void {
    this.auth.cerrarSesion();
  }
}
