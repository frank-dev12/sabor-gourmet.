import type { Mesa, MesaInput } from "@/lib/types";
import { request, withQuery } from "./client";

export const mesasApi = {
  listar: () => request<Mesa[]>("/mesas"),

  disponibles: (filtro: { inicio: string; fin: string; personas: number }) =>
    request<Mesa[]>(withQuery("/mesas/disponibles", filtro)),

  crear: (data: MesaInput) => request<Mesa>("/mesas", { method: "POST", json: data }),
};
