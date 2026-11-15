"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/format";
import { CATEGORIAS } from "@/lib/labels";
import type { Producto } from "@/lib/types";
import { AjusteStock } from "./AjusteStock";
import { StockBadge } from "./StockBadge";

/** Versión en tarjetas de ProductosTable para pantallas estrechas. */
export function ProductoCards({
  productos,
  onAjustarStock,
  onDesactivar,
  className,
}: {
  productos: Producto[];
  onAjustarStock: (producto: Producto, cantidad: number) => Promise<void>;
  onDesactivar: (producto: Producto) => void;
  className?: string;
}) {
  return (
    <ul className={cn("grid gap-3 sm:grid-cols-2", className)}>
      {productos.map((p) => (
        <li key={p.id} className={cn("flex flex-col rounded-lg border border-stone-200 p-4", !p.activo && "opacity-50")}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium text-stone-900">{p.nombre}</p>
              {p.descripcion && <p className="line-clamp-2 text-xs text-stone-500">{p.descripcion}</p>}
            </div>
            <span className="font-semibold whitespace-nowrap tabular-nums text-stone-900">{formatMoney(p.precio)}</span>
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge>{CATEGORIAS[p.categoria]}</Badge>
            {p.activo ? <StockBadge stock={p.stock} /> : <Badge>Inactivo</Badge>}
          </div>

          <div className="flex-1" />
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-stone-100 pt-3">
            <AjusteStock disabled={!p.activo} onAjustar={(cantidad) => onAjustarStock(p, cantidad)} />
            {p.activo && (
              <Button size="sm" variant="ghost" onClick={() => onDesactivar(p)}>
                Desactivar
              </Button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
