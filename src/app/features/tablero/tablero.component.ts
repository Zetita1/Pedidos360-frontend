import { CurrencyPipe, DatePipe, KeyValuePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { Tablero } from '../../core/models/pedidos360.models';
import { Pedidos360ApiService } from '../../core/services/pedidos360-api.service';

/** Tablero de inicio: indicadores agregados que el BFF entrega en una sola llamada. */
@Component({
  selector: 'app-tablero',
  imports: [CurrencyPipe, DatePipe, KeyValuePipe, RouterLink],
  templateUrl: './tablero.component.html',
  styleUrl: './tablero.component.scss',
})
export class TableroComponent {
  private readonly api = inject(Pedidos360ApiService);
  protected readonly auth = inject(AuthService);

  protected readonly cargando = signal(true);
  protected readonly datos = signal<Tablero | null>(null);

  constructor() {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.api.tablero().subscribe({
      next: (tablero) => {
        this.datos.set(tablero);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }
}
