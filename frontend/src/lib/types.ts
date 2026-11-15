// Reflejo de los DTOs del backend (com.saborgourmet.dto). Las fechas llegan como LocalDateTime sin zona: "2026-12-20T20:00:00".

export type CategoriaProducto = "ENTRADA" | "PLATO_FUERTE" | "ACOMPANAMIENTO" | "POSTRE" | "BEBIDA";

export interface Producto {
  id: number;
  nombre: string;
  descripcion: string | null;
  categoria: CategoriaProducto;
  precio: number;
  stock: number;
  activo: boolean;
}

export interface ProductoInput {
  nombre: string;
  descripcion?: string;
  categoria: CategoriaProducto;
  precio: number;
  stock: number;
}

export type EstadoPedido = "PENDIENTE" | "EN_PREPARACION" | "LISTO" | "ENTREGADO" | "CANCELADO";
export type TipoPedido = "EN_MESA" | "PARA_LLEVAR" | "DOMICILIO";
export type MetodoPago = "EFECTIVO" | "TRANSFERENCIA" | "BILLETERA_DIGITAL";

export interface PedidoItem {
  id: number;
  productoId: number;
  nombreProducto: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface Pedido {
  id: number;
  nombreCliente: string;
  tipo: TipoPedido;
  numeroMesa: number | null;
  direccionEntrega: string | null;
  metodoPago: MetodoPago | null;
  estado: EstadoPedido;
  observaciones: string | null;
  items: PedidoItem[];
  total: number;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface PedidoInput {
  nombreCliente: string;
  tipo: TipoPedido;
  numeroMesa?: number | null;
  direccionEntrega?: string | null;
  metodoPago?: MetodoPago | null;
  observaciones?: string;
  items: { productoId: number; cantidad: number }[];
}

export interface Mesa {
  id: number;
  numero: number;
  capacidad: number;
  ubicacion: string | null;
  activa: boolean;
}

export interface MesaInput {
  numero: number;
  capacidad: number;
  ubicacion?: string;
}

export type EstadoReserva = "CONFIRMADA" | "COMPLETADA" | "CANCELADA";

export interface Reserva {
  id: number;
  mesaId: number;
  numeroMesa: number;
  nombreCliente: string;
  telefono: string | null;
  numeroPersonas: number;
  fechaHoraInicio: string;
  fechaHoraFin: string;
  estado: EstadoReserva;
  observaciones: string | null;
  fechaCreacion: string;
}

export interface ReservaInput {
  mesaId: number;
  nombreCliente: string;
  telefono?: string;
  numeroPersonas: number;
  fechaHoraInicio: string;
  fechaHoraFin: string;
  observaciones?: string;
}
