import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { Pedido } from '../../core/models/pedidos360.models';
import { Pedidos360ApiService } from '../../core/services/pedidos360-api.service';

/** Pedidos registrados por el usuario autenticado, resueltos por el claim oid del token. */
@Component({
  selector: 'app-mis-pedidos',
  imports: [CurrencyPipe, DatePipe, RouterLink],
  template: `
    <header style="margin-bottom: 1rem">
      <h1>Mis pedidos</h1>
      <p class="texto-suave">
        Pedidos asociados a tu identidad en el IDaaS ({{ auth.usuarioId() || 'sin oid' }})
      </p>
    </header>

    <section class="panel">
      @if (cargando()) {
        <p class="vacio">Cargando...</p>
      } @else if (pedidos().length === 0) {
        <p class="vacio">Todavia no registras pedidos.</p>
      } @else {
        <table>
          <thead>
            <tr><th>Numero</th><th>Cliente</th><th>Estado</th><th>Total</th><th>Creado</th><th></th></tr>
          </thead>
          <tbody>
            @for (pedido of pedidos(); track pedido.id) {
              <tr>
                <td>{{ pedido.numero }}</td>
                <td>{{ pedido.clienteRazonSocial }}</td>
                <td><span class="etiqueta etiqueta--{{ pedido.estado }}">{{ pedido.estado }}</span></td>
                <td>{{ pedido.total | currency: 'CLP' : 'symbol-narrow' : '1.0-0' }}</td>
                <td>{{ pedido.creadoEn | date: 'dd-MM-yyyy HH:mm' }}</td>
                <td><a [routerLink]="['/pedidos', pedido.id]">Ver</a></td>
              </tr>
            }
          </tbody>
        </table>
      }
    </section>
  `,
})
export class MisPedidosComponent {
  private readonly api = inject(Pedidos360ApiService);
  protected readonly auth = inject(AuthService);

  protected readonly pedidos = signal<Pedido[]>([]);
  protected readonly cargando = signal(true);

  constructor() {
    this.api.misPedidos().subscribe({
      next: (pedidos) => {
        this.pedidos.set(pedidos);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }
}
