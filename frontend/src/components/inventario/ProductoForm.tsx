"use client";

import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { describeError, productosApi } from "@/lib/api";
import { CATEGORIAS, opciones } from "@/lib/labels";
import type { CategoriaProducto } from "@/lib/types";

const VACIO = { nombre: "", categoria: "PLATO_FUERTE" as CategoriaProducto, precio: "", stock: "", descripcion: "" };

export function ProductoForm({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState(VACIO);
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tone: "error" | "success"; text: string } | null>(null);

  const set = <K extends keyof typeof VACIO>(campo: K, valor: (typeof VACIO)[K]) =>
    setForm((f) => ({ ...f, [campo]: valor }));

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEnviando(true);
    setMensaje(null);
    try {
      const creado = await productosApi.crear({
        nombre: form.nombre,
        categoria: form.categoria,
        precio: Number(form.precio),
        stock: Number(form.stock),
        descripcion: form.descripcion || undefined,
      });
      setForm(VACIO);
      setMensaje({ tone: "success", text: `"${creado.nombre}" agregado al inventario.` });
      onCreated();
    } catch (error) {
      setMensaje({ tone: "error", text: describeError(error) });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Nombre">
        <Input required maxLength={120} value={form.nombre} onChange={(e) => set("nombre", e.target.value)} placeholder="Lomo saltado" />
      </Field>

      <Field label="Categoría">
        <Select value={form.categoria} onChange={(e) => set("categoria", e.target.value as CategoriaProducto)}>
          {opciones(CATEGORIAS).map((c) => (
            <option key={c} value={c}>
              {CATEGORIAS[c]}
            </option>
          ))}
        </Select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Precio">
          <Input required type="number" min="0.01" step="0.01" value={form.precio} onChange={(e) => set("precio", e.target.value)} placeholder="0.00" />
        </Field>
        <Field label="Stock inicial">
          <Input required type="number" min="0" step="1" value={form.stock} onChange={(e) => set("stock", e.target.value)} placeholder="0" />
        </Field>
      </div>

      <Field label="Descripción" hint="Opcional">
        <Textarea maxLength={500} value={form.descripcion} onChange={(e) => set("descripcion", e.target.value)} />
      </Field>

      {mensaje && <Alert tone={mensaje.tone} message={mensaje.text} onClose={() => setMensaje(null)} />}

      <Button type="submit" loading={enviando} className="w-full">
        Agregar producto
      </Button>
    </form>
  );
}
