import type { EstadoPedido, Pedido, PedidoInput } from "@/lib/types";
import { request, withQuery } from "./client";

export const pedidosApi = {
  listar: (estado?: EstadoPedido) => request<Pedido[]>(withQuery("/pedidos", { estado })),

  crear: (data: PedidoInput) => request<Pedido>("/pedidos", { method: "POST", json: data }),

  cambiarEstado: (id: number, estado: EstadoPedido) =>
    request<Pedido>(`/pedidos/${id}/estado`, { method: "PATCH", json: { estado } }),
};
