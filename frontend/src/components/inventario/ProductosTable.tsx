"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/format";
import { CATEGORIAS } from "@/lib/labels";
import type { Producto } from "@/lib/types";
import { AjusteStock } from "./AjusteStock";
import { StockBadge } from "./StockBadge";

export function ProductosTable({
  productos,
  onAjustarStock,
  onDesactivar,
}: {
  productos: Producto[];
  onAjustarStock: (producto: Producto, cantidad: number) => Promise<void>;
  onDesactivar: (producto: Producto) => void;
}) {
  return (
    <div className="-mx-5 overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-stone-200 text-left text-xs font-medium tracking-wide text-stone-500 uppercase">
            <th className="px-5 py-2">Producto</th>
            <th className="px-3 py-2">Categoría</th>
            <th className="px-3 py-2 text-right">Precio</th>
            <th className="px-3 py-2">Stock</th>
            <th className="px-3 py-2">Ajustar</th>
            <th className="px-5 py-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {productos.map((p) => (
            <tr key={p.id} className={cn(!p.activo && "opacity-50")}>
              <td className="px-5 py-3">
                <p className="font-medium text-stone-900">{p.nombre}</p>
                {p.descripcion && <p className="line-clamp-1 text-xs text-stone-500">{p.descripcion}</p>}
              </td>
              <td className="px-3 py-3">
                <Badge>{CATEGORIAS[p.categoria]}</Badge>
              </td>
              <td className="px-3 py-3 text-right whitespace-nowrap tabular-nums">{formatMoney(p.precio)}</td>
              <td className="px-3 py-3">{p.activo ? <StockBadge stock={p.stock} /> : <Badge>Inactivo</Badge>}</td>
              <td className="px-3 py-3">
                <AjusteStock disabled={!p.activo} onAjustar={(cantidad) => onAjustarStock(p, cantidad)} />
              </td>
              <td className="px-5 py-3 text-right">
                {p.activo && (
                  <Button size="sm" variant="ghost" onClick={() => onDesactivar(p)}>
                    Desactivar
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
