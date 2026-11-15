"use client";

import { useCallback, useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Field";
import { EmptyState, LoadingRows } from "@/components/ui/States";
import { useApiData } from "@/hooks/useApiData";
import { describeError, mesasApi } from "@/lib/api";

const VACIO = { numero: "", capacidad: "4", ubicacion: "" };

export function MesasPanel() {
  const cargar = useCallback(() => mesasApi.listar(), []);
  const { data: mesas, error, loading, reload } = useApiData(cargar);
  const [form, setForm] = useState(VACIO);
  const [enviando, setEnviando] = useState(false);
  const [errorForm, setErrorForm] = useState<string | null>(null);

  async function crear(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEnviando(true);
    setErrorForm(null);
    try {
      await mesasApi.crear({
        numero: Number(form.numero),
        capacidad: Number(form.capacidad),
        ubicacion: form.ubicacion || undefined,
      });
      setForm(VACIO);
      reload();
    } catch (err) {
      setErrorForm(describeError(err));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Card>
      <CardHeader title="Mesas del salón" description="Capacidad y ubicación de cada mesa." />
      <CardBody className="space-y-4">
        <form onSubmit={crear} className="flex flex-wrap items-end gap-3">
          <Field label="Número" className="w-24">
            <Input required type="number" min={1} value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} />
          </Field>
          <Field label="Capacidad" className="w-24">
            <Input required type="number" min={1} max={50} value={form.capacidad} onChange={(e) => setForm({ ...form, capacidad: e.target.value })} />
          </Field>
          <Field label="Ubicación" className="min-w-40 flex-1">
            <Input maxLength={60} placeholder="Terraza, salón, barra…" value={form.ubicacion} onChange={(e) => setForm({ ...form, ubicacion: e.target.value })} />
          </Field>
          <Button type="submit" variant="secondary" loading={enviando}>
            Agregar mesa
          </Button>
        </form>

        {(errorForm || error) && <Alert message={(errorForm ?? error)!} onClose={errorForm ? () => setErrorForm(null) : undefined} />}

        {loading ? (
          <LoadingRows rows={2} />
        ) : mesas && mesas.length > 0 ? (
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
            {mesas.map((m) => (
              <li key={m.id} className="rounded-lg border border-stone-200 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-stone-900">Mesa {m.numero}</span>
                  {!m.activa && <Badge>Inactiva</Badge>}
                </div>
                <p className="text-xs text-stone-500">
                  {m.capacidad} personas{m.ubicacion && ` · ${m.ubicacion}`}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          !error && <EmptyState title="No hay mesas registradas" description="Agrega las mesas del salón para poder reservar." />
        )}
      </CardBody>
    </Card>
  );
}
