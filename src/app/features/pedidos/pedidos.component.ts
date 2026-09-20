import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { EstadoPedido, Pedido } from '../../core/models/pedidos360.models';
import { NotificacionesService } from '../../core/services/notificaciones.service';
import { Pedidos360ApiService } from '../../core/services/pedidos360-api.service';

/** Listado de pedidos con filtro por estado y acciones segun rol. */
@Component({
  selector: 'app-pedidos',
  imports: [CurrencyPipe, DatePipe, ReactiveFormsModule, RouterLink],
  templateUrl: './pedidos.component.html',
  styleUrl: './pedidos.component.scss',
})
export class PedidosComponent {
  private readonly api = inject(Pedidos360ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly notificaciones = inject(NotificacionesService);
  protected readonly auth = inject(AuthService);

  protected readonly estados: EstadoPedido[] = [
    'BORRADOR',
    'CONFIRMADO',
    'EN_PREPARACION',
    'DESPACHADO',
    'ENTREGADO',
    'ANULADO',
  ];

  protected readonly pedidos = signal<Pedido[]>([]);
  protected readonly cargando = signal(false);
  protected readonly filtroEstado = this.fb.nonNullable.control<EstadoPedido | ''>('');

  constructor() {
    this.buscar();
  }

  protected buscar(): void {
    this.cargando.set(true);
    this.api.pedidos({ estado: this.filtroEstado.value }).subscribe({
      next: (pedidos) => {
        this.pedidos.set(pedidos);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  protected confirmar(pedido: Pedido): void {
    this.api.confirmarPedido(pedido.id).subscribe({
      next: () => {
        this.notificaciones.exito(`Pedido ${pedido.numero} confirmado y stock descontado`);
        this.buscar();
      },
    });
  }

  protected anular(pedido: Pedido): void {
    this.api.anularPedido(pedido.id, 'Anulado desde el listado').subscribe({
      next: () => {
        this.notificaciones.exito(`Pedido ${pedido.numero} anulado`);
        this.buscar();
      },
    });
  }
}
