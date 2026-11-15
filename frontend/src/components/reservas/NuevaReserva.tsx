"use client";

import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { describeError, mesasApi, reservasApi } from "@/lib/api";
import { cn } from "@/lib/cn";
import { formatHora, rangoHorario } from "@/lib/format";
import type { Mesa } from "@/lib/types";

const DURACIONES = [
  { minutos: 60, label: "1 hora" },
  { minutos: 90, label: "1 h 30 min" },
  { minutos: 120, label: "2 horas" },
  { minutos: 180, label: "3 horas" },
];

interface Busqueda {
  inicio: string;
  fin: string;
  personas: number;
  mesas: Mesa[];
}

export function NuevaReserva({
  fecha,
  onFechaChange,
  onCreated,
}: {
  fecha: string;
  onFechaChange: (fecha: string) => void;
  onCreated: () => void;
}) {
  const [hora, setHora] = useState("20:00");
  const [duracion, setDuracion] = useState(120);
  const [personas, setPersonas] = useState(2);
  const [busqueda, setBusqueda] = useState<Busqueda | null>(null);
  const [mesaId, setMesaId] = useState<number | null>(null);
  const [cliente, setCliente] = useState({ nombre: "", telefono: "", observaciones: "" });
  const [buscando, setBuscando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tone: "error" | "success"; text: string } | null>(null);

  /** Cualquier cambio en los criterios invalida el resultado anterior para no reservar con datos viejos. */
  function cambiarCriterio(aplicar: () => void) {
    aplicar();
    setBusqueda(null);
    setMesaId(null);
  }

  async function buscar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBuscando(true);
    setMensaje(null);
    setMesaId(null);
    try {
      const { inicio, fin } = rangoHorario(fecha, hora, duracion);
      const mesas = await mesasApi.disponibles({ inicio, fin, personas });
      setBusqueda({ inicio, fin, personas, mesas });
    } catch (error) {
      setMensaje({ tone: "error", text: describeError(error) });
    } finally {
      setBuscando(false);
    }
  }

  async function reservar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!busqueda || mesaId === null) return;
    setGuardando(true);
    setMensaje(null);
    try {
      const reserva = await reservasApi.crear({
        mesaId,
        nombreCliente: cliente.nombre,
        telefono: cliente.telefono || undefined,
        observaciones: cliente.observaciones || undefined,
        numeroPersonas: busqueda.personas,
        fechaHoraInicio: busqueda.inicio,
        fechaHoraFin: busqueda.fin,
      });
      setMensaje({
        tone: "success",
        text: `Reserva #${reserva.id} confirmada: mesa ${reserva.numeroMesa}, ${formatHora(reserva.fechaHoraInicio)}–${formatHora(reserva.fechaHoraFin)}.`,
      });
      setCliente({ nombre: "", telefono: "", observaciones: "" });
      setBusqueda(null);
      setMesaId(null);
      onCreated();
    } catch (error) {
      setMensaje({ tone: "error", text: describeError(error) });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={buscar} className="grid grid-cols-2 gap-3">
        <Field label="Fecha" className="col-span-2 sm:col-span-1">
          <Input required type="date" value={fecha} onChange={(e) => cambiarCriterio(() => onFechaChange(e.target.value))} />
        </Field>
        <Field label="Hora" className="col-span-2 sm:col-span-1">
          <Input required type="time" step={900} value={hora} onChange={(e) => cambiarCriterio(() => setHora(e.target.value))} />
        </Field>
        <Field label="Duración">
          <Select value={duracion} onChange={(e) => cambiarCriterio(() => setDuracion(Number(e.target.value)))}>
            {DURACIONES.map((d) => (
              <option key={d.minutos} value={d.minutos}>
                {d.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Personas">
          <Input
            required
            type="number"
            min={1}
            max={50}
            value={personas}
            onChange={(e) => cambiarCriterio(() => setPersonas(Number(e.target.value)))}
          />
        </Field>
        <Button type="submit" variant="secondary" loading={buscando} className="col-span-2">
          Buscar mesas libres
        </Button>
      </form>

      {busqueda && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-stone-700">
            {busqueda.mesas.length > 0
              ? `${busqueda.mesas.length} mesa(s) libres de ${formatHora(busqueda.inicio)} a ${formatHora(busqueda.fin)}`
              : "No hay mesas libres para ese horario y número de personas."}
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {busqueda.mesas.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMesaId(m.id)}
                aria-pressed={mesaId === m.id}
                className={cn(
                  "rounded-lg border p-3 text-left transition",
                  mesaId === m.id ? "border-amber-500 bg-amber-50 ring-1 ring-amber-500" : "border-stone-200 hover:border-amber-300",
                )}
              >
                <span className="block font-semibold text-stone-900">Mesa {m.numero}</span>
                <span className="block text-xs text-stone-500">
                  {m.capacidad} personas{m.ubicacion && ` · ${m.ubicacion}`}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {busqueda && mesaId !== null && (
        <form onSubmit={reservar} className="space-y-3 border-t border-stone-100 pt-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nombre del cliente">
              <Input required maxLength={120} value={cliente.nombre} onChange={(e) => setCliente({ ...cliente, nombre: e.target.value })} />
            </Field>
            <Field label="Teléfono" hint="Opcional">
              <Input type="tel" maxLength={30} value={cliente.telefono} onChange={(e) => setCliente({ ...cliente, telefono: e.target.value })} />
            </Field>
          </div>
          <Field label="Observaciones" hint="Opcional: cumpleaños, silla para bebé…">
            <Textarea maxLength={500} value={cliente.observaciones} onChange={(e) => setCliente({ ...cliente, observaciones: e.target.value })} />
          </Field>
          <Button type="submit" loading={guardando} className="w-full">
            Confirmar reserva
          </Button>
        </form>
      )}

      {mensaje && <Alert tone={mensaje.tone} message={mensaje.text} onClose={() => setMensaje(null)} />}
    </div>
  );
}
