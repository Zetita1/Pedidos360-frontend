import { Injectable, signal } from '@angular/core';

export type TipoNotificacion = 'exito' | 'error' | 'info';

export interface Notificacion {
  id: number;
  tipo: TipoNotificacion;
  mensaje: string;
}

/** Cola simple de avisos que la barra superior muestra al usuario. */
@Injectable({ providedIn: 'root' })
export class NotificacionesService {
  private contador = 0;
  readonly items = signal<Notificacion[]>([]);

  exito(mensaje: string): void {
    this.publicar('exito', mensaje);
  }

  error(mensaje: string): void {
    this.publicar('error', mensaje);
  }

  info(mensaje: string): void {
    this.publicar('info', mensaje);
  }

  cerrar(id: number): void {
    this.items.update((actuales) => actuales.filter((item) => item.id !== id));
  }

  private publicar(tipo: TipoNotificacion, mensaje: string): void {
    const id = ++this.contador;
    this.items.update((actuales) => [...actuales, { id, tipo, mensaje }]);
    setTimeout(() => this.cerrar(id), 6000);
  }
}
