"use client";

import { useCallback, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState, LoadingRows } from "@/components/ui/States";
import { useApiData } from "@/hooks/useApiData";
import { describeError, reservasApi } from "@/lib/api";
import type { EstadoReserva, Reserva } from "@/lib/types";
import { MesasPanel } from "./MesasPanel";
import { NuevaReserva } from "./NuevaReserva";
import { ReservaItem } from "./ReservaItem";

/** `hoy` llega del servidor en cada petición: calcularlo aquí lo congelaría en la fecha del build. */
export function ReservasView({ hoy }: { hoy: string }) {
  const [fecha, setFecha] = useState(hoy);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);

  const cargar = useCallback(() => reservasApi.listar({ fecha }), [fecha]);
  const { data: reservas, error, loading, reload } = useApiData(cargar);

  async function cambiarEstado(reserva: Reserva, estado: EstadoReserva) {
    setErrorAccion(null);
    try {
      await reservasApi.cambiarEstado(reserva.id, estado);
      reload();
    } catch (e) {
      setErrorAccion(describeError(e));
    }
  }

  const confirmadas = reservas?.filter((r) => r.estado === "CONFIRMADA").length ?? 0;
  const mensajeError = errorAccion ?? error;

  return (
    <>
      <PageHeader title="Reservas" description="Encuentra una mesa libre y registra la reserva sin cruces de horario." />

      <div className="grid items-start gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader title="Nueva reserva" description="1. Busca disponibilidad · 2. Elige mesa · 3. Confirma" />
          <CardBody>
            <NuevaReserva fecha={fecha} onFechaChange={setFecha} onCreated={reload} />
          </CardBody>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader
            title="Agenda del día"
            description={reservas ? `${confirmadas} confirmada(s) de ${reservas.length}` : undefined}
            actions={
              <>
                <Input type="date" aria-label="Fecha de la agenda" value={fecha} onChange={(e) => setFecha(e.target.value)} className="h-9 w-40" />
                <Button size="sm" variant="ghost" onClick={reload}>
                  Actualizar
                </Button>
              </>
            }
          />
          <CardBody className="space-y-3">
            {mensajeError && <Alert message={mensajeError} onClose={errorAccion ? () => setErrorAccion(null) : undefined} />}
            {loading ? (
              <LoadingRows />
            ) : reservas && reservas.length > 0 ? (
              <ul className="divide-y divide-stone-100">
                {reservas.map((r) => (
                  <ReservaItem key={r.id} reserva={r} onCambiarEstado={cambiarEstado} />
                ))}
              </ul>
            ) : (
              !error && <EmptyState title="Sin reservas para esta fecha" />
            )}
          </CardBody>
        </Card>
      </div>

      <div className="mt-6">
        <MesasPanel />
      </div>
    </>
  );
}
