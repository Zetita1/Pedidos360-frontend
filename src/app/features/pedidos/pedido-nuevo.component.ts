import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { Cliente, Producto } from '../../core/models/pedidos360.models';
import { NotificacionesService } from '../../core/services/notificaciones.service';
import { Pedidos360ApiService } from '../../core/services/pedidos360-api.service';

interface LineaCarro {
  producto: Producto;
  cantidad: number;
}

/** Alta de pedidos: selecciona cliente, arma el carro y envia el pedido al BFF. */
@Component({
  selector: 'app-pedido-nuevo',
  imports: [CurrencyPipe, ReactiveFormsModule, RouterLink],
  templateUrl: './pedido-nuevo.component.html',
  styleUrl: './pedido-nuevo.component.scss',
})
export class PedidoNuevoComponent {
  private readonly api = inject(Pedidos360ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly notificaciones = inject(NotificacionesService);

  protected readonly clientes = signal<Cliente[]>([]);
  protected readonly productos = signal<Producto[]>([]);
  protected readonly carro = signal<LineaCarro[]>([]);
  protected readonly guardando = signal(false);

  protected readonly formulario = this.fb.nonNullable.group({
    clienteId: [0, [Validators.required, Validators.min(1)]],
    direccionDespacho: [''],
    observacion: [''],
  });

  protected readonly seleccion = this.fb.nonNullable.group({
    productoId: [0],
    cantidad: [1, [Validators.min(1)]],
  });

  protected readonly neto = computed(() =>
    this.carro().reduce((suma, linea) => suma + linea.producto.precio * linea.cantidad, 0),
  );

  protected readonly iva = computed(() => Math.round(this.neto() * 0.19));

  protected readonly total = computed(() => this.neto() + this.iva());

  constructor() {
    this.api.clientes().subscribe({ next: (clientes) => this.clientes.set(clientes) });
    this.api.productos({ soloActivos: true }).subscribe({ next: (productos) => this.productos.set(productos) });
  }

  protected agregar(): void {
    const { productoId, cantidad } = this.seleccion.getRawValue();
    const producto = this.productos().find((p) => p.id === Number(productoId));

    if (!producto || cantidad < 1) {
      this.notificaciones.error('Selecciona un producto y una cantidad valida.');
      return;
    }
    if (cantidad > producto.stock) {
      this.notificaciones.error(`Solo hay ${producto.stock} unidades de ${producto.sku}.`);
      return;
    }

    this.carro.update((lineas) => {
      const existente = lineas.find((linea) => linea.producto.id === producto.id);
      if (existente) {
        return lineas.map((linea) =>
          linea.producto.id === producto.id
            ? { ...linea, cantidad: linea.cantidad + cantidad }
            : linea,
        );
      }
      return [...lineas, { producto, cantidad }];
    });

    this.seleccion.reset({ productoId: 0, cantidad: 1 });
  }

  protected quitar(productoId: number): void {
    this.carro.update((lineas) => lineas.filter((linea) => linea.producto.id !== productoId));
  }

  protected guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    if (this.carro().length === 0) {
      this.notificaciones.error('Agrega al menos un producto al pedido.');
      return;
    }

    const datos = this.formulario.getRawValue();
    this.guardando.set(true);

    this.api
      .crearPedido({
        clienteId: Number(datos.clienteId),
        direccionDespacho: datos.direccionDespacho || undefined,
        observacion: datos.observacion || undefined,
        lineas: this.carro().map((linea) => ({
          productoId: linea.producto.id,
          cantidad: linea.cantidad,
        })),
      })
      .subscribe({
        next: (pedido) => {
          this.notificaciones.exito(`Pedido ${pedido.numero} creado en estado BORRADOR`);
          this.guardando.set(false);
          void this.router.navigate(['/pedidos', pedido.id]);
        },
        error: () => this.guardando.set(false),
      });
  }
}
