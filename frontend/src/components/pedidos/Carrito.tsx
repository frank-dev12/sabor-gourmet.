import { Button } from "@/components/ui/Button";
import { formatMoney } from "@/lib/format";
import type { Producto } from "@/lib/types";

export interface LineaCarrito {
  producto: Producto;
  cantidad: number;
}

export function Carrito({
  lineas,
  onCambiarCantidad,
}: {
  lineas: LineaCarrito[];
  onCambiarCantidad: (productoId: number, cantidad: number) => void;
}) {
  if (lineas.length === 0) {
    return <p className="rounded-lg bg-stone-50 px-3 py-4 text-center text-sm text-stone-500">Aún no hay productos en el pedido.</p>;
  }

  const total = lineas.reduce((acc, l) => acc + l.producto.precio * l.cantidad, 0);

  return (
    <div className="rounded-lg ring-1 ring-stone-200">
      <ul className="divide-y divide-stone-100">
        {lineas.map(({ producto, cantidad }) => (
          <li key={producto.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
            <span className="min-w-0 flex-1 truncate">{producto.nombre}</span>
            <span className="inline-flex items-center gap-1">
              <Button size="sm" variant="ghost" onClick={() => onCambiarCantidad(producto.id, cantidad - 1)} aria-label={`Quitar uno de ${producto.nombre}`}>
                −
              </Button>
              <span className="w-6 text-center tabular-nums">{cantidad}</span>
              <Button
                size="sm"
                variant="ghost"
                disabled={cantidad >= producto.stock}
                onClick={() => onCambiarCantidad(producto.id, cantidad + 1)}
                aria-label={`Agregar uno de ${producto.nombre}`}
              >
                +
              </Button>
            </span>
            <span className="w-24 text-right tabular-nums">{formatMoney(producto.precio * cantidad)}</span>
          </li>
        ))}
      </ul>
      <div className="flex justify-between border-t border-stone-200 bg-stone-50 px-3 py-2 text-sm font-semibold">
        <span>Total</span>
        <span className="tabular-nums">{formatMoney(total)}</span>
      </div>
    </div>
  );
}
