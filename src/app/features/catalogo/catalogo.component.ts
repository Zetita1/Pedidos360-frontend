import { CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AuthService } from '../../core/auth/auth.service';
import { Producto } from '../../core/models/pedidos360.models';
import { NotificacionesService } from '../../core/services/notificaciones.service';
import { Pedidos360ApiService } from '../../core/services/pedidos360-api.service';

/**
 * Catalogo de productos. La vista se adapta al rol: quien tiene Pedidos.Admin ve el
 * formulario de alta; el resto solo consulta.
 */
@Component({
  selector: 'app-catalogo',
  imports: [CurrencyPipe, ReactiveFormsModule],
  templateUrl: './catalogo.component.html',
  styleUrl: './catalogo.component.scss',
})
export class CatalogoComponent {
  private readonly api = inject(Pedidos360ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly notificaciones = inject(NotificacionesService);
  protected readonly auth = inject(AuthService);

  protected readonly productos = signal<Producto[]>([]);
  protected readonly categorias = signal<string[]>([]);
  protected readonly cargando = signal(false);
  protected readonly guardando = signal(false);
  protected readonly mostrarFormulario = signal(false);

  protected readonly filtros = this.fb.nonNullable.group({
    buscar: '',
    categoria: '',
  });

  protected readonly formulario = this.fb.nonNullable.group({
    sku: ['', [Validators.required, Validators.maxLength(40)]],
    nombre: ['', [Validators.required, Validators.maxLength(150)]],
    descripcion: ['', [Validators.maxLength(500)]],
    precio: [0, [Validators.required, Validators.min(1)]],
    stock: [0, [Validators.required, Validators.min(0)]],
    categoria: ['', [Validators.required, Validators.maxLength(60)]],
  });

  constructor() {
    this.buscar();
    this.api.categorias().subscribe({
      next: (categorias) => this.categorias.set(categorias),
      error: () => this.categorias.set([]),
    });
  }

  protected buscar(): void {
    this.cargando.set(true);
    const { buscar, categoria } = this.filtros.getRawValue();
    this.api.productos({ buscar, categoria, soloActivos: true }).subscribe({
      next: (productos) => {
        this.productos.set(productos);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  protected limpiar(): void {
    this.filtros.reset({ buscar: '', categoria: '' });
    this.buscar();
  }

  protected alternarFormulario(): void {
    this.mostrarFormulario.update((visible) => !visible);
  }

  protected guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    this.api.crearProducto(this.formulario.getRawValue()).subscribe({
      next: (producto) => {
        this.notificaciones.exito(`Producto ${producto.sku} creado`);
        this.formulario.reset({ sku: '', nombre: '', descripcion: '', precio: 0, stock: 0, categoria: '' });
        this.guardando.set(false);
        this.mostrarFormulario.set(false);
        this.buscar();
      },
      error: () => this.guardando.set(false),
    });
  }

  protected desactivar(producto: Producto): void {
    this.api.desactivarProducto(producto.id).subscribe({
      next: () => {
        this.notificaciones.exito(`Producto ${producto.sku} dado de baja`);
        this.buscar();
      },
    });
  }

  protected campoInvalido(nombre: string): boolean {
    const campo = this.formulario.get(nombre);
    return !!campo && campo.invalid && campo.touched;
  }
}
