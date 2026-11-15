import type { EstadoReserva, Reserva, ReservaInput } from "@/lib/types";
import { request, withQuery } from "./client";

export const reservasApi = {
  /** Sin fecha, el backend devuelve las de hoy. */
  listar: (filtro: { fecha?: string; mesaId?: number } = {}) =>
    request<Reserva[]>(withQuery("/reservas", filtro)),

  crear: (data: ReservaInput) => request<Reserva>("/reservas", { method: "POST", json: data }),

  cambiarEstado: (id: number, estado: EstadoReserva) =>
    request<Reserva>(`/reservas/${id}/estado`, { method: "PATCH", json: { estado } }),
};
