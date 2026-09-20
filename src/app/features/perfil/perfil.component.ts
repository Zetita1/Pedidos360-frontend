import { DatePipe, JsonPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';

import { AuthService } from '../../core/auth/auth.service';
import { PerfilUsuario } from '../../core/models/pedidos360.models';
import { Pedidos360ApiService } from '../../core/services/pedidos360-api.service';

/**
 * Muestra lado a lado lo que el SPA lee del token y lo que el BFF resuelve del mismo token.
 * Sirve como evidencia de que ambos extremos interpretan los mismos claims.
 */
@Component({
  selector: 'app-perfil',
  imports: [DatePipe, JsonPipe],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.scss',
})
export class PerfilComponent {
  private readonly api = inject(Pedidos360ApiService);
  protected readonly auth = inject(AuthService);

  protected readonly perfilBackend = signal<PerfilUsuario | null>(null);
  protected readonly error = signal(false);

  constructor() {
    this.api.perfil().subscribe({
      next: (perfil) => this.perfilBackend.set(perfil),
      error: () => this.error.set(true),
    });
  }

  protected vencimiento(): Date | null {
    return this.auth.vencimientoToken();
  }
}
