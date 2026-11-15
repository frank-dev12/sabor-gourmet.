"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatHora } from "@/lib/format";
import { ESTADOS_RESERVA } from "@/lib/labels";
import type { EstadoReserva, Reserva } from "@/lib/types";

export function ReservaItem({
  reserva,
  onCambiarEstado,
}: {
  reserva: Reserva;
  onCambiarEstado: (reserva: Reserva, estado: EstadoReserva) => Promise<void>;
}) {
  const [enviando, setEnviando] = useState<EstadoReserva | null>(null);
  const estado = ESTADOS_RESERVA[reserva.estado];

  async function cambiar(nuevo: EstadoReserva) {
    setEnviando(nuevo);
    try {
      await onCambiarEstado(reserva, nuevo);
    } finally {
      setEnviando(null);
    }
  }

  return (
    <li className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex min-w-0 flex-1 items-start gap-4">
        <div className="w-16 shrink-0 tabular-nums">
          <p className="font-semibold text-stone-900">{formatHora(reserva.fechaHoraInicio)}</p>
          <p className="text-xs text-stone-500">a {formatHora(reserva.fechaHoraFin)}</p>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-stone-900">{reserva.nombreCliente}</p>
          <p className="text-xs text-stone-500">
            Mesa {reserva.numeroMesa} · {reserva.numeroPersonas} personas{reserva.telefono && ` · ${reserva.telefono}`}
          </p>
          {reserva.observaciones && <p className="mt-0.5 truncate text-xs text-amber-800">{reserva.observaciones}</p>}
        </div>
        <Badge tone={estado.tone}>{estado.label}</Badge>
      </div>
      {reserva.estado === "CONFIRMADA" && (
        <div className="flex gap-2 pl-20 sm:shrink-0 sm:pl-0">
          <Button size="sm" variant="danger" loading={enviando === "CANCELADA"} disabled={enviando !== null} onClick={() => cambiar("CANCELADA")}>
            Cancelar
          </Button>
          <Button size="sm" variant="secondary" loading={enviando === "COMPLETADA"} disabled={enviando !== null} onClick={() => cambiar("COMPLETADA")}>
            Completar
          </Button>
        </div>
      )}
    </li>
  );
}
