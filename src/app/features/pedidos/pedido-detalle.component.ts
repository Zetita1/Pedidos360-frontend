import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { EstadoPedido, Pedido } from '../../core/models/pedidos360.models';
import { NotificacionesService } from '../../core/services/notificaciones.service';
import { Pedidos360ApiService } from '../../core/services/pedidos360-api.service';

/** Detalle de un pedido con las transiciones de estado permitidas por el backend. */
@Component({
  selector: 'app-pedido-detalle',
  imports: [CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './pedido-detalle.component.html',
  styleUrl: './pedido-detalle.component.scss',
})
export class PedidoDetalleComponent {
  private readonly api = inject(Pedidos360ApiService);
  private readonly notificaciones = inject(NotificacionesService);
  protected readonly auth = inject(AuthService);

  /** Id del pedido tomado de la ruta (withComponentInputBinding). */
  readonly id = input.required<string>();

  protected readonly pedido = signal<Pedido | null>(null);
  protected readonly cargando = signal(true);

  /** Misma maquina de estados que valida el microservicio de pedidos. */
  private readonly transiciones: Record<EstadoPedido, EstadoPedido[]> = {
    BORRADOR: ['CONFIRMADO', 'ANULADO'],
    CONFIRMADO: ['EN_PREPARACION', 'ANULADO'],
    EN_PREPARACION: ['DESPACHADO', 'ANULADO'],
    DESPACHADO: ['ENTREGADO'],
    ENTREGADO: [],
    ANULADO: [],
  };

  constructor() {
    // El input de ruta llega despues de construir el componente: el effect se dispara
    // cuando el id esta disponible y tambien si el usuario navega a otro pedido.
    effect(() => {
      const id = Number(this.id());
      if (!Number.isNaN(id)) {
        this.buscar(id);
      }
    });
  }

  protected siguientesEstados(): EstadoPedido[] {
    const actual = this.pedido()?.estado;
    return actual ? this.transiciones[actual] : [];
  }

  protected cargar(): void {
    this.buscar(Number(this.id()));
  }

  private buscar(id: number): void {
    this.cargando.set(true);
    this.api.pedido(id).subscribe({
      next: (pedido) => {
        this.pedido.set(pedido);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  protected avanzar(estado: EstadoPedido): void {
    const actual = this.pedido();
    if (!actual) {
      return;
    }

    const peticion =
      estado === 'ANULADO'
        ? this.api.anularPedido(actual.id, 'Anulado desde el detalle')
        : this.api.cambiarEstado(actual.id, estado);

    peticion.subscribe({
      next: (actualizado) => {
        this.pedido.set(actualizado);
        this.notificaciones.exito(`Pedido ${actualizado.numero} ahora esta en ${actualizado.estado}`);
      },
    });
  }
}
