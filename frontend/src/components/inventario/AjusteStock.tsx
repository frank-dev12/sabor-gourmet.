"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

/** Suma o resta la cantidad indicada; el backend rechaza ajustes que dejen el stock en negativo. */
export function AjusteStock({
  disabled,
  onAjustar,
}: {
  disabled?: boolean;
  onAjustar: (cantidad: number) => Promise<void>;
}) {
  const [cantidad, setCantidad] = useState(1);
  const [enviando, setEnviando] = useState(false);

  async function ajustar(signo: 1 | -1) {
    setEnviando(true);
    try {
      await onAjustar(signo * cantidad);
    } finally {
      setEnviando(false);
    }
  }

  const bloqueado = disabled || enviando || cantidad < 1;

  return (
    <div className="inline-flex items-center gap-1">
      <Button size="sm" variant="secondary" disabled={bloqueado} onClick={() => ajustar(-1)} title="Retirar del stock" aria-label="Retirar del stock">
        −
      </Button>
      <input
        type="number"
        min={1}
        value={cantidad}
        onChange={(e) => setCantidad(Math.max(0, Math.trunc(Number(e.target.value))))}
        className="h-8 w-14 rounded-md border-0 text-center text-sm ring-1 ring-inset ring-stone-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
        aria-label="Cantidad a ajustar"
        disabled={disabled}
      />
      <Button size="sm" variant="secondary" disabled={bloqueado} onClick={() => ajustar(1)} title="Reponer stock" aria-label="Reponer stock">
        +
      </Button>
    </div>
  );
}
