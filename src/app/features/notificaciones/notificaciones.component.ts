import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';

import {
  Documento,
  Notificacion,
  RegistroAuditoria,
} from '../../core/models/pedidos360.models';
import { NotificacionesService } from '../../core/services/notificaciones.service';
import { Pedidos360ApiService } from '../../core/services/pedidos360-api.service';

/**
 * Bandeja de lo que generaron los consumidores de RabbitMQ: los avisos al cliente y los
 * tickets de los pedidos confirmados.
 *
 * <p>Nada de esto se crea desde el SPA: aparece solo cuando ms-pedidos publica un evento y
 * ms-notificaciones lo consume.
 */
@Component({
  selector: 'app-notificaciones',
  imports: [DatePipe],
  templateUrl: './notificaciones.component.html',
  styleUrl: './notificaciones.component.scss',
})
export class NotificacionesComponent {
  private readonly api = inject(Pedidos360ApiService);
  private readonly avisos = inject(NotificacionesService);

  protected readonly notificaciones = signal<Notificacion[]>([]);
  protected readonly documentos = signal<Documento[]>([]);
  protected readonly auditoria = signal<RegistroAuditoria[]>([]);
  protected readonly cargando = signal(false);
  protected readonly ticketAbierto = signal<Documento | null>(null);

  constructor() {
    this.refrescar();
  }

  /** Vuelve a pedir avisos y tickets al microservicio de notificaciones. */
  protected refrescar(): void {
    this.cargando.set(true);
    this.api.notificaciones(50).subscribe({
      next: (notificaciones) => {
        this.notificaciones.set(notificaciones);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
    this.api.documentos(20).subscribe({
      next: (documentos) => this.documentos.set(documentos),
      error: () => this.documentos.set([]),
    });
    // La auditoria solo la ven los roles de gestion: si responde 403 el panel no se muestra.
    this.api.auditoria(20).subscribe({
      next: (registros) => this.auditoria.set(registros),
      error: () => this.auditoria.set([]),
    });
  }

  /**
   * Muestra el contenido del ticket.
   *
   * @param documento ticket seleccionado
   */
  protected verTicket(documento: Documento): void {
    this.ticketAbierto.set(this.ticketAbierto()?.id === documento.id ? null : documento);
  }

  /**
   * Copia el ticket al portapapeles, util para pegarlo en el informe.
   *
   * @param documento ticket a copiar
   */
  protected copiarTicket(documento: Documento): void {
    navigator.clipboard
      .writeText(documento.contenido)
      .then(() => this.avisos.exito(`Ticket ${documento.folio} copiado`))
      .catch(() => this.avisos.error('No fue posible copiar el ticket'));
  }

  /**
   * Clase CSS segun el tipo de aviso.
   *
   * @param tipo tipo de notificacion
   * @return sufijo de la clase
   */
  protected clase(tipo: string): string {
    return tipo.toLowerCase();
  }
}
