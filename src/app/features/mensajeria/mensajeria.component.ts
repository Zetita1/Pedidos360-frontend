import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AuthService } from '../../core/auth/auth.service';
import {
  Cola,
  Exchange,
  TopologiaMensajeria,
} from '../../core/models/pedidos360.models';
import { NotificacionesService } from '../../core/services/notificaciones.service';
import { Pedidos360ApiService } from '../../core/services/pedidos360-api.service';

/** Patron de nombres aceptado por el microservicio administrador. */
const PATRON_NOMBRE = /^[a-zA-Z0-9._-]+$/;

/**
 * Administracion de la mensajeria: muestra la topologia declarada por la aplicacion y
 * permite crear, purgar y eliminar colas, exchanges y bindings a traves del microservicio
 * administrador.
 *
 * <p>Las colas del sistema se marcan y no se pueden eliminar: esa regla la impone el
 * backend, aqui solo se refleja.
 */
@Component({
  selector: 'app-mensajeria',
  imports: [ReactiveFormsModule],
  templateUrl: './mensajeria.component.html',
  styleUrl: './mensajeria.component.scss',
})
export class MensajeriaComponent {
  private readonly api = inject(Pedidos360ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly avisos = inject(NotificacionesService);
  protected readonly auth = inject(AuthService);

  protected readonly topologia = signal<TopologiaMensajeria | null>(null);
  protected readonly colas = signal<Cola[]>([]);
  protected readonly exchanges = signal<Exchange[]>([]);
  protected readonly cargando = signal(false);
  protected readonly trabajando = signal(false);
  protected readonly pestana = signal<'colas' | 'exchanges' | 'bindings'>('colas');

  protected readonly formCola = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(3), Validators.pattern(PATRON_NOMBRE)]],
    durable: [true],
    conDlq: [true],
  });

  protected readonly formExchange = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(3), Validators.pattern(PATRON_NOMBRE)]],
    tipo: ['topic', [Validators.required]],
    durable: [true],
  });

  protected readonly formBinding = this.fb.nonNullable.group({
    cola: ['', [Validators.required, Validators.pattern(PATRON_NOMBRE)]],
    exchange: ['', [Validators.required, Validators.pattern(PATRON_NOMBRE)]],
    routingKey: ['', [Validators.required, Validators.maxLength(255)]],
  });

  constructor() {
    this.refrescar();
  }

  /** Recarga topologia, colas y exchanges desde el microservicio administrador. */
  protected refrescar(): void {
    this.cargando.set(true);
    this.api.topologiaMensajeria().subscribe({
      next: (topologia) => this.topologia.set(topologia),
      error: () => this.topologia.set(null),
    });
    this.api.colas().subscribe({
      next: (colas) => {
        this.colas.set(colas);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
    this.api.exchanges().subscribe({
      next: (exchanges) => this.exchanges.set(exchanges),
      error: () => this.exchanges.set([]),
    });
  }

  /**
   * Cambia de pestana.
   *
   * @param pestana seccion a mostrar
   */
  protected mostrar(pestana: 'colas' | 'exchanges' | 'bindings'): void {
    this.pestana.set(pestana);
  }

  protected crearCola(): void {
    if (this.formCola.invalid) {
      this.formCola.markAllAsTouched();
      return;
    }
    this.trabajando.set(true);
    this.api.crearCola(this.formCola.getRawValue()).subscribe({
      next: (cola) => {
        this.avisos.exito(`Cola ${cola.nombre} creada`);
        this.formCola.reset({ nombre: '', durable: true, conDlq: true });
        this.trabajando.set(false);
        this.refrescar();
      },
      error: () => this.trabajando.set(false),
    });
  }

  /**
   * Vacia una cola sin eliminarla.
   *
   * @param cola cola seleccionada
   */
  protected purgar(cola: Cola): void {
    this.trabajando.set(true);
    this.api.purgarCola(cola.nombre).subscribe({
      next: () => {
        this.avisos.info(`Cola ${cola.nombre} purgada`);
        this.trabajando.set(false);
        this.refrescar();
      },
      error: () => this.trabajando.set(false),
    });
  }

  /**
   * Elimina una cola propia (las del sistema estan protegidas por el backend).
   *
   * @param cola cola seleccionada
   */
  protected eliminarCola(cola: Cola): void {
    if (!confirm(`Eliminar la cola ${cola.nombre}?`)) {
      return;
    }
    this.trabajando.set(true);
    this.api.eliminarCola(cola.nombre).subscribe({
      next: () => {
        this.avisos.exito(`Cola ${cola.nombre} eliminada`);
        this.trabajando.set(false);
        this.refrescar();
      },
      error: () => this.trabajando.set(false),
    });
  }

  protected crearExchange(): void {
    if (this.formExchange.invalid) {
      this.formExchange.markAllAsTouched();
      return;
    }
    this.trabajando.set(true);
    this.api.crearExchange(this.formExchange.getRawValue()).subscribe({
      next: (exchange) => {
        this.avisos.exito(`Exchange ${exchange.nombre} creado`);
        this.formExchange.reset({ nombre: '', tipo: 'topic', durable: true });
        this.trabajando.set(false);
        this.refrescar();
      },
      error: () => this.trabajando.set(false),
    });
  }

  /**
   * Elimina un exchange propio.
   *
   * @param exchange exchange seleccionado
   */
  protected eliminarExchange(exchange: Exchange): void {
    if (!confirm(`Eliminar el exchange ${exchange.nombre}?`)) {
      return;
    }
    this.trabajando.set(true);
    this.api.eliminarExchange(exchange.nombre).subscribe({
      next: () => {
        this.avisos.exito(`Exchange ${exchange.nombre} eliminado`);
        this.trabajando.set(false);
        this.refrescar();
      },
      error: () => this.trabajando.set(false),
    });
  }

  protected crearBinding(): void {
    if (this.formBinding.invalid) {
      this.formBinding.markAllAsTouched();
      return;
    }
    this.trabajando.set(true);
    this.api.crearBinding(this.formBinding.getRawValue()).subscribe({
      next: (operacion) => {
        this.avisos.exito(operacion.detalle);
        this.formBinding.reset({ cola: '', exchange: '', routingKey: '' });
        this.trabajando.set(false);
      },
      error: () => this.trabajando.set(false),
    });
  }

  protected eliminarBinding(): void {
    if (this.formBinding.invalid) {
      this.formBinding.markAllAsTouched();
      return;
    }
    this.trabajando.set(true);
    this.api.eliminarBinding(this.formBinding.getRawValue()).subscribe({
      next: (operacion) => {
        this.avisos.info(operacion.detalle);
        this.trabajando.set(false);
      },
      error: () => this.trabajando.set(false),
    });
  }

  /**
   * Indica si un control del formulario de colas debe mostrar error.
   *
   * @param campo nombre del control
   * @return true si esta invalido y el usuario ya lo toco
   */
  protected colaInvalida(campo: string): boolean {
    const control = this.formCola.get(campo);
    return !!control && control.invalid && control.touched;
  }

  /**
   * Indica si un control del formulario de exchanges debe mostrar error.
   *
   * @param campo nombre del control
   * @return true si esta invalido y el usuario ya lo toco
   */
  protected exchangeInvalido(campo: string): boolean {
    const control = this.formExchange.get(campo);
    return !!control && control.invalid && control.touched;
  }

  /**
   * Indica si un control del formulario de bindings debe mostrar error.
   *
   * @param campo nombre del control
   * @return true si esta invalido y el usuario ya lo toco
   */
  protected bindingInvalido(campo: string): boolean {
    const control = this.formBinding.get(campo);
    return !!control && control.invalid && control.touched;
  }
}
