"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatFechaHora, formatMoney } from "@/lib/format";
import { ESTADOS_PEDIDO, METODOS_PAGO, SIGUIENTE_ESTADO_PEDIDO, TIPOS_PEDIDO } from "@/lib/labels";
import type { EstadoPedido, Pedido } from "@/lib/types";

export function PedidoCard({
  pedido,
  onCambiarEstado,
}: {
  pedido: Pedido;
  onCambiarEstado: (pedido: Pedido, estado: EstadoPedido) => Promise<void>;
}) {
  const [enviando, setEnviando] = useState<EstadoPedido | null>(null);
  const estado = ESTADOS_PEDIDO[pedido.estado];
  const siguiente = SIGUIENTE_ESTADO_PEDIDO[pedido.estado];
  const esFinal = pedido.estado === "ENTREGADO" || pedido.estado === "CANCELADO";

  async function cambiar(nuevo: EstadoPedido) {
    setEnviando(nuevo);
    try {
      await onCambiarEstado(pedido, nuevo);
    } finally {
      setEnviando(null);
    }
  }

  return (
    <article className="rounded-lg border border-stone-200 p-4">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-stone-900">
            #{pedido.id} · {pedido.nombreCliente}
          </h3>
          <p className="text-xs text-stone-500">
            {TIPOS_PEDIDO[pedido.tipo]}
            {pedido.numeroMesa !== null && ` · Mesa ${pedido.numeroMesa}`}
            {pedido.metodoPago && ` · ${METODOS_PAGO[pedido.metodoPago]}`} · {formatFechaHora(pedido.fechaCreacion)}
          </p>
          {pedido.direccionEntrega && (
            <p className="mt-0.5 text-xs text-stone-600">{pedido.direccionEntrega}</p>
          )}
        </div>
        <Badge tone={estado.tone}>{estado.label}</Badge>
      </header>

      <ul className="mt-3 space-y-1 text-sm">
        {pedido.items.map((item) => (
          <li key={item.id} className="flex justify-between gap-2">
            <span className="text-stone-700">
              <span className="tabular-nums text-stone-500">{item.cantidad}×</span> {item.nombreProducto}
            </span>
            <span className="tabular-nums text-stone-600">{formatMoney(item.subtotal)}</span>
          </li>
        ))}
      </ul>
      {pedido.observaciones && <p className="mt-2 rounded bg-amber-50 px-2 py-1 text-xs text-amber-900">{pedido.observaciones}</p>}

      <footer className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-3">
        <span className="font-semibold tabular-nums">{formatMoney(pedido.total)}</span>
        {!esFinal && (
          <div className="flex gap-2">
            <Button size="sm" variant="danger" loading={enviando === "CANCELADO"} disabled={enviando !== null} onClick={() => cambiar("CANCELADO")}>
              Cancelar
            </Button>
            {siguiente && (
              <Button size="sm" loading={enviando === siguiente} disabled={enviando !== null} onClick={() => cambiar(siguiente)}>
                Marcar {ESTADOS_PEDIDO[siguiente].label.toLowerCase()}
              </Button>
            )}
          </div>
        )}
      </footer>
    </article>
  );
}
