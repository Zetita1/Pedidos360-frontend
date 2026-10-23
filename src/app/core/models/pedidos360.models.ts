/** Modelos que consume el SPA desde el BFF. */

export type EstadoPedido =
  | 'BORRADOR'
  | 'CONFIRMADO'
  | 'EN_PREPARACION'
  | 'DESPACHADO'
  | 'ENTREGADO'
  | 'ANULADO';

export type SegmentoCliente = 'MINORISTA' | 'MAYORISTA' | 'EMPRESA';

export interface Permisos {
  gestionarCatalogo: boolean;
  gestionarClientes: boolean;
  crearPedidos: boolean;
  anularPedidos: boolean;
  verTablero: boolean;
}

export interface PerfilUsuario {
  id: string;
  nombre: string;
  email?: string;
  tenantId?: string;
  roles: string[];
  scopes: string[];
  permisos: Permisos;
}

export interface Producto {
  id: number;
  sku: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  stock: number;
  categoria: string;
  activo: boolean;
  actualizadoEn?: string;
}

export interface ProductoRequest {
  sku?: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  stock: number;
  categoria: string;
}

export interface Direccion {
  calle: string;
  numero?: string;
  comuna: string;
  ciudad: string;
  region?: string;
}

export interface Cliente {
  id: number;
  rut: string;
  razonSocial: string;
  email: string;
  telefono?: string;
  segmento: SegmentoCliente;
  direccion?: Direccion;
  direccionFormateada?: string;
  activo: boolean;
}

export interface ClienteRequest {
  rut?: string;
  razonSocial: string;
  email: string;
  telefono?: string;
  segmento: SegmentoCliente;
  direccion: Direccion;
}

export interface LineaPedido {
  id?: number;
  productoId: number;
  sku?: string;
  nombreProducto?: string;
  cantidad: number;
  precioUnitario?: number;
  subtotal?: number;
}

export interface Pedido {
  id: number;
  numero: string;
  clienteId: number;
  clienteRut: string;
  clienteRazonSocial: string;
  estado: EstadoPedido;
  direccionDespacho?: string;
  observacion?: string;
  neto: number;
  iva: number;
  total: number;
  registradoPor?: string;
  lineas: LineaPedido[];
  creadoEn: string;
  actualizadoEn: string;
}

export interface CrearPedidoRequest {
  clienteId: number;
  direccionDespacho?: string;
  observacion?: string;
  lineas: Array<{ productoId: number; cantidad: number }>;
}

export interface ProductoCritico {
  id: number;
  sku: string;
  nombre: string;
  stock: number;
  precio: number;
}

export interface PedidoResumen {
  id: number;
  numero: string;
  cliente: string;
  estado: EstadoPedido;
  total: number;
  creadoEn?: string;
}

export interface Tablero {
  totalPedidos: number;
  pedidosPorEstado: Record<string, number>;
  montoEnCurso: number;
  productosActivos: number;
  stockCritico: ProductoCritico[];
  ultimosPedidos: PedidoResumen[];
}

// --- Mensajeria (EP3: RabbitMQ) --------------------------------------------

export type TipoNotificacion = 'RECEPCION' | 'CONFIRMACION' | 'SEGUIMIENTO';

/** Aviso generado por un consumidor a partir de un evento de pedido. */
export interface Notificacion {
  id: number;
  tipo: TipoNotificacion;
  pedidoNumero: string;
  clienteId?: number;
  destinatario?: string;
  asunto: string;
  mensaje: string;
  eventoId: string;
  creadoEn: string;
}

/** Ticket emitido de forma asincrona al confirmarse un pedido. */
export interface Documento {
  id: number;
  folio: string;
  pedidoNumero: string;
  clienteId?: number;
  clienteNombre?: string;
  total: number;
  contenido: string;
  eventoId: string;
  creadoEn: string;
}

/** Cola declarada en el broker, con su carga actual. */
export interface Cola {
  nombre: string;
  mensajes?: number;
  consumidores?: number;
  delSistema: boolean;
}

/** Exchange declarado en el broker. */
export interface Exchange {
  nombre: string;
  tipo: string;
  durable?: boolean;
  delSistema: boolean;
}

/** Routing key configurada para un evento de dominio. */
export interface RutaMensajeria {
  evento: string;
  routingKey: string;
}

/** Colas de un caso de uso: principal, de reintento y de mensajes muertos. */
export interface CasoDeUsoMensajeria {
  casoDeUso: string;
  cola: string;
  colaReintento: string;
  dlq: string;
}

/** Topologia declarada por la aplicacion. */
export interface TopologiaMensajeria {
  exchange: string;
  exchangeDescarte: string;
  maxIntentos: number;
  esperaReintentoMs: number;
  rutas: RutaMensajeria[];
  casos: CasoDeUsoMensajeria[];
}

/** Resultado de una operacion de administracion sobre el broker. */
export interface OperacionMensajeria {
  operacion: string;
  recurso: string;
  detalle: string;
}

export interface CrearColaRequest {
  nombre: string;
  durable?: boolean;
  conDlq?: boolean;
  mensajeTtlMs?: number;
  maxMensajes?: number;
}

export interface CrearExchangeRequest {
  nombre: string;
  tipo: string;
  durable?: boolean;
}

export interface BindingRequest {
  cola: string;
  exchange: string;
  routingKey: string;
}
