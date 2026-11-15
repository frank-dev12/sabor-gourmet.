"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Field";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/format";
import { CATEGORIAS } from "@/lib/labels";
import type { Producto } from "@/lib/types";

export function ProductoPicker({
  productos,
  enCarrito,
  onAgregar,
}: {
  productos: Producto[];
  enCarrito: Record<number, number>;
  onAgregar: (producto: Producto) => void;
}) {
  const [busqueda, setBusqueda] = useState("");
  const termino = busqueda.trim().toLowerCase();
  const visibles = termino ? productos.filter((p) => p.nombre.toLowerCase().includes(termino)) : productos;

  return (
    <div className="space-y-2">
      <Input type="search" placeholder="Buscar producto…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />

      {visibles.length === 0 ? (
        <p className="rounded-lg bg-stone-50 px-3 py-6 text-center text-sm text-stone-500">Sin productos disponibles</p>
      ) : (
        <ul className="grid max-h-80 grid-cols-2 gap-2 overflow-y-auto p-0.5">
          {visibles.map((p) => {
            const cantidad = enCarrito[p.id] ?? 0;
            const restante = p.stock - cantidad;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => onAgregar(p)}
                  disabled={restante <= 0}
                  aria-label={`Agregar ${p.nombre}`}
                  className={cn(
                    "relative flex h-full w-full flex-col rounded-lg border p-3 text-left transition",
                    "hover:border-amber-400 hover:bg-amber-50/50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-stone-200 disabled:hover:bg-transparent",
                    cantidad > 0 ? "border-amber-500 bg-amber-50 ring-1 ring-amber-500" : "border-stone-200 bg-white",
                  )}
                >
                  {cantidad > 0 && (
                    <span className="absolute top-2 right-2 grid size-5 place-items-center rounded-full bg-amber-600 text-xs font-semibold text-white tabular-nums">
                      {cantidad}
                    </span>
                  )}
                  <span className="pr-6 text-sm font-medium leading-snug text-stone-900">{p.nombre}</span>
                  <span className="text-xs text-stone-500">{CATEGORIAS[p.categoria]}</span>
                  <span className="mt-auto flex items-end justify-between gap-2 pt-2">
                    <span className="text-sm font-semibold tabular-nums text-stone-900">{formatMoney(p.precio)}</span>
                    <span className="text-xs text-stone-500">quedan {restante}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
