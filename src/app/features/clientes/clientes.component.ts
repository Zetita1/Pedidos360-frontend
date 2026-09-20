import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AuthService } from '../../core/auth/auth.service';
import { Cliente } from '../../core/models/pedidos360.models';
import { NotificacionesService } from '../../core/services/notificaciones.service';
import { Pedidos360ApiService } from '../../core/services/pedidos360-api.service';

/** Mantenedor de clientes para los roles Pedidos.Admin y Pedidos.Vendedor. */
@Component({
  selector: 'app-clientes',
  imports: [ReactiveFormsModule],
  templateUrl: './clientes.component.html',
  styleUrl: './clientes.component.scss',
})
export class ClientesComponent {
  private readonly api = inject(Pedidos360ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly notificaciones = inject(NotificacionesService);
  protected readonly auth = inject(AuthService);

  protected readonly clientes = signal<Cliente[]>([]);
  protected readonly cargando = signal(false);
  protected readonly guardando = signal(false);
  protected readonly mostrarFormulario = signal(false);

  protected readonly filtro = this.fb.nonNullable.control('');

  protected readonly formulario = this.fb.nonNullable.group({
    rut: ['', [Validators.required, Validators.pattern(/^[0-9]{7,8}-[0-9kK]$/)]],
    razonSocial: ['', [Validators.required, Validators.maxLength(150)]],
    email: ['', [Validators.required, Validators.email]],
    telefono: [''],
    segmento: ['MINORISTA' as Cliente['segmento'], [Validators.required]],
    direccion: this.fb.nonNullable.group({
      calle: ['', [Validators.required]],
      numero: [''],
      comuna: ['', [Validators.required]],
      ciudad: ['', [Validators.required]],
      region: [''],
    }),
  });

  constructor() {
    this.buscar();
  }

  protected buscar(): void {
    this.cargando.set(true);
    this.api.clientes(this.filtro.value).subscribe({
      next: (clientes) => {
        this.clientes.set(clientes);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
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
    this.api.crearCliente(this.formulario.getRawValue()).subscribe({
      next: (cliente) => {
        this.notificaciones.exito(`Cliente ${cliente.razonSocial} creado`);
        this.formulario.reset({ segmento: 'MINORISTA' });
        this.guardando.set(false);
        this.mostrarFormulario.set(false);
        this.buscar();
      },
      error: () => this.guardando.set(false),
    });
  }

  protected campoInvalido(ruta: string): boolean {
    const campo = this.formulario.get(ruta);
    return !!campo && campo.invalid && campo.touched;
  }
}
