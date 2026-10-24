import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  BindingRequest,
  Cliente,
  ClienteRequest,
  Cola,
  CrearColaRequest,
  CrearExchangeRequest,
  CrearPedidoRequest,
  Documento,
  EstadoPedido,
  Exchange,
  Notificacion,
  OperacionMensajeria,
  Pedido,
  PerfilUsuario,
  Producto,
  ProductoRequest,
  RegistroAuditoria,
  Tablero,
  TopologiaMensajeria,
} from '../models/pedidos360.models';

/**
 * Unico punto de salida HTTP del SPA. Todo sale por el AWS API Gateway: el CRUD va a la
 * ruta del microservicio duenio del recurso y las vistas agregadas al BFF. El
 * MsalInterceptor adjunta el access token a cada llamada.
 */
@Injectable({ providedIn: 'root' })
export class Pedidos360ApiService {
  private readonly http = inject(HttpClient);

  /** Origen del API Gateway; vacio en desarrollo (lo resuelve el proxy de ng serve). */
  private readonly origen = environment.apiBaseUrl;

  /** Rutas publicadas en el API Gateway, una por microservicio. */
  private readonly bff = `${this.origen}${environment.rutas.bff}`;
  private readonly pedidosUrl = `${this.origen}${environment.rutas.pedidos}`;
  private readonly productosUrl = `${this.origen}${environment.rutas.productos}`;
  private readonly clientesUrl = `${this.origen}${environment.rutas.clientes}`;
  private readonly notificacionesUrl = `${this.origen}${environment.rutas.notificaciones}`;
  private readonly mensajeriaUrl = `${this.origen}${environment.rutas.mensajeria}`;

  // --- Perfil -------------------------------------------------------------

  perfil(): Observable<PerfilUsuario> {
    return this.http.get<PerfilUsuario>(`${this.bff}/perfil`);
  }

  // --- Tablero ------------------------------------------------------------

  tablero(): Observable<Tablero> {
    return this.http.get<Tablero>(`${this.bff}/tablero`);
  }

  // --- Catalogo -----------------------------------------------------------

  productos(filtros: { buscar?: string; categoria?: string; soloActivos?: boolean } = {}): Observable<Producto[]> {
    let params = new HttpParams();
    if (filtros.buscar) {
      params = params.set('buscar', filtros.buscar);
    }
    if (filtros.categoria) {
      params = params.set('categoria', filtros.categoria);
    }
    params = params.set('soloActivos', String(filtros.soloActivos ?? true));

    return this.http.get<Producto[]>(`${this.productosUrl}`, { params });
  }

  categorias(): Observable<string[]> {
    return this.http.get<string[]>(`${this.productosUrl}/categorias`);
  }

  crearProducto(producto: ProductoRequest): Observable<Producto> {
    return this.http.post<Producto>(`${this.productosUrl}`, producto);
  }

  actualizarProducto(id: number, producto: ProductoRequest): Observable<Producto> {
    return this.http.put<Producto>(`${this.productosUrl}/${id}`, producto);
  }

  desactivarProducto(id: number): Observable<void> {
    return this.http.delete<void>(`${this.productosUrl}/${id}`);
  }

  // --- Clientes -----------------------------------------------------------

  clientes(buscar?: string): Observable<Cliente[]> {
    let params = new HttpParams();
    if (buscar) {
      params = params.set('buscar', buscar);
    }
    return this.http.get<Cliente[]>(`${this.clientesUrl}`, { params });
  }

  miFicha(): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.clientesUrl}/mi-ficha`);
  }

  crearCliente(cliente: ClienteRequest): Observable<Cliente> {
    return this.http.post<Cliente>(`${this.clientesUrl}`, cliente);
  }

  // --- Pedidos ------------------------------------------------------------

  pedidos(filtros: { estado?: EstadoPedido | ''; clienteId?: number } = {}): Observable<Pedido[]> {
    let params = new HttpParams();
    if (filtros.estado) {
      params = params.set('estado', filtros.estado);
    }
    if (filtros.clienteId) {
      params = params.set('clienteId', String(filtros.clienteId));
    }
    return this.http.get<Pedido[]>(`${this.pedidosUrl}`, { params });
  }

  misPedidos(): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(`${this.pedidosUrl}/mis-pedidos`);
  }

  pedido(id: number): Observable<Pedido> {
    return this.http.get<Pedido>(`${this.pedidosUrl}/${id}`);
  }

  crearPedido(pedido: CrearPedidoRequest): Observable<Pedido> {
    return this.http.post<Pedido>(`${this.pedidosUrl}`, pedido);
  }

  confirmarPedido(id: number): Observable<Pedido> {
    return this.http.post<Pedido>(`${this.pedidosUrl}/${id}/confirmar`, {});
  }

  cambiarEstado(id: number, estado: EstadoPedido, motivo?: string): Observable<Pedido> {
    return this.http.put<Pedido>(`${this.pedidosUrl}/${id}/estado`, { estado, motivo });
  }

  anularPedido(id: number, motivo?: string): Observable<Pedido> {
    let params = new HttpParams();
    if (motivo) {
      params = params.set('motivo', motivo);
    }
    return this.http.put<Pedido>(`${this.pedidosUrl}/${id}/anular`, {}, { params });
  }

  // --- Notificaciones y documentos (generados desde RabbitMQ) --------------

  notificaciones(limite = 50): Observable<Notificacion[]> {
    const params = new HttpParams().set('limite', String(limite));
    return this.http.get<Notificacion[]>(`${this.notificacionesUrl}`, { params });
  }

  notificacionesDePedido(numero: string): Observable<Notificacion[]> {
    return this.http.get<Notificacion[]>(`${this.notificacionesUrl}/pedido/${numero}`);
  }

  documentos(limite = 20): Observable<Documento[]> {
    const params = new HttpParams().set('limite', String(limite));
    return this.http.get<Documento[]>(`${this.notificacionesUrl}/documentos`, { params });
  }

  auditoria(limite = 50): Observable<RegistroAuditoria[]> {
    const params = new HttpParams().set('limite', String(limite));
    return this.http.get<RegistroAuditoria[]>(`${this.notificacionesUrl}/auditoria`, { params });
  }

  // --- Administracion del broker ------------------------------------------

  topologiaMensajeria(): Observable<TopologiaMensajeria> {
    return this.http.get<TopologiaMensajeria>(`${this.mensajeriaUrl}/topologia`);
  }

  colas(): Observable<Cola[]> {
    return this.http.get<Cola[]>(`${this.mensajeriaUrl}/colas`);
  }

  crearCola(cola: CrearColaRequest): Observable<Cola> {
    return this.http.post<Cola>(`${this.mensajeriaUrl}/colas`, cola);
  }

  purgarCola(nombre: string): Observable<Cola> {
    return this.http.post<Cola>(`${this.mensajeriaUrl}/colas/${nombre}/purgar`, {});
  }

  eliminarCola(nombre: string): Observable<OperacionMensajeria> {
    return this.http.delete<OperacionMensajeria>(`${this.mensajeriaUrl}/colas/${nombre}`);
  }

  exchanges(): Observable<Exchange[]> {
    return this.http.get<Exchange[]>(`${this.mensajeriaUrl}/exchanges`);
  }

  crearExchange(exchange: CrearExchangeRequest): Observable<Exchange> {
    return this.http.post<Exchange>(`${this.mensajeriaUrl}/exchanges`, exchange);
  }

  eliminarExchange(nombre: string): Observable<OperacionMensajeria> {
    return this.http.delete<OperacionMensajeria>(`${this.mensajeriaUrl}/exchanges/${nombre}`);
  }

  crearBinding(binding: BindingRequest): Observable<OperacionMensajeria> {
    return this.http.post<OperacionMensajeria>(`${this.mensajeriaUrl}/bindings`, binding);
  }

  eliminarBinding(binding: BindingRequest): Observable<OperacionMensajeria> {
    return this.http.delete<OperacionMensajeria>(`${this.mensajeriaUrl}/bindings`, { body: binding });
  }
}
