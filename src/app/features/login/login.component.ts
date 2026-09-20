import { Component, computed, effect, inject } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';

/** Pantalla de bienvenida que dispara el login contra Microsoft Entra ID. */
@Component({
  selector: 'app-login',
  imports: [],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly ocupado = computed(() => this.auth.ocupado());
  protected readonly autenticado = computed(() => this.auth.autenticado());

  constructor() {
    // Si el usuario ya tiene sesion, no tiene sentido mostrarle el login.
    effect(() => {
      if (this.auth.autenticado()) {
        void this.router.navigate(['/']);
      }
    });
  }

  protected ingresar(): void {
    this.auth.iniciarSesion();
  }
}
