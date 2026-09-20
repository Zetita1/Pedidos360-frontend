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
