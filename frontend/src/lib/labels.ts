import type { Tone } from "@/components/ui/Badge";
import type { CategoriaProducto, EstadoPedido, EstadoReserva, MetodoPago, TipoPedido } from "@/lib/types";

export const CATEGORIAS: Record<CategoriaProducto, string> = {
  ENTRADA: "Entrada",
  PLATO_FUERTE: "Plato fuerte",
  ACOMPANAMIENTO: "Acompañamiento",
  POSTRE: "Postre",
  BEBIDA: "Bebida",
};

export const TIPOS_PEDIDO: Record<TipoPedido, string> = {
  EN_MESA: "En mesa",
  PARA_LLEVAR: "Para llevar",
  DOMICILIO: "Domicilio",
};

/** Solo aplica a pedidos DOMICILIO. */
export const METODOS_PAGO: Record<MetodoPago, string> = {
  EFECTIVO: "Efectivo",
  TRANSFERENCIA: "Transferencia",
  BILLETERA_DIGITAL: "Yape / Plin",
};

export const ESTADOS_PEDIDO: Record<EstadoPedido, { label: string; tone: Tone }> = {
  PENDIENTE: { label: "Pendiente", tone: "amber" },
  EN_PREPARACION: { label: "En preparación", tone: "blue" },
  LISTO: { label: "Listo", tone: "violet" },
  ENTREGADO: { label: "Entregado", tone: "green" },
  CANCELADO: { label: "Cancelado", tone: "red" },
};

/** Flujo normal de cocina; CANCELADO se ofrece aparte mientras el pedido no esté en un estado final. */
export const SIGUIENTE_ESTADO_PEDIDO: Partial<Record<EstadoPedido, EstadoPedido>> = {
  PENDIENTE: "EN_PREPARACION",
  EN_PREPARACION: "LISTO",
  LISTO: "ENTREGADO",
};

export const ESTADOS_RESERVA: Record<EstadoReserva, { label: string; tone: Tone }> = {
  CONFIRMADA: { label: "Confirmada", tone: "blue" },
  COMPLETADA: { label: "Completada", tone: "green" },
  CANCELADA: { label: "Cancelada", tone: "red" },
};

export function opciones<K extends string>(mapa: Record<K, unknown>): K[] {
  return Object.keys(mapa) as K[];
}
