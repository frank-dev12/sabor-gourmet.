import type { CategoriaProducto, Producto, ProductoInput } from "@/lib/types";
import { request, withQuery } from "./client";

export const productosApi = {
  listar: (filtros: { categoria?: CategoriaProducto; disponibles?: boolean } = {}) =>
    request<Producto[]>(withQuery("/productos", filtros)),

  crear: (data: ProductoInput) => request<Producto>("/productos", { method: "POST", json: data }),

  /** cantidad > 0 repone, < 0 descuenta (mermas/correcciones). */
  ajustarStock: (id: number, cantidad: number) =>
    request<Producto>(`/productos/${id}/stock`, { method: "PATCH", json: { cantidad } }),

  desactivar: (id: number) => request<void>(`/productos/${id}`, { method: "DELETE" }),
};
