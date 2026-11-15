"use client";

import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { describeError, pedidosApi } from "@/lib/api";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/format";
import { METODOS_PAGO, TIPOS_PEDIDO, opciones } from "@/lib/labels";
import type { MetodoPago, Producto, TipoPedido } from "@/lib/types";
import { Carrito, type LineaCarrito } from "./Carrito";
import { ProductoPicker } from "./ProductoPicker";

export function NuevoPedidoForm({ productos, onCreated }: { productos: Producto[]; onCreated: () => void }) {
  const [nombreCliente, setNombreCliente] = useState("");
  const [tipo, setTipo] = useState<TipoPedido>("EN_MESA");
  const [numeroMesa, setNumeroMesa] = useState("");
  const [direccionEntrega, setDireccionEntrega] = useState("");
  const [metodoPago, setMetodoPago] = useState<MetodoPago>("EFECTIVO");
  const [observaciones, setObservaciones] = useState("");
  const [carrito, setCarrito] = useState<Record<number, number>>({});
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tone: "error" | "success"; text: string } | null>(null);

  const lineas: LineaCarrito[] = Object.entries(carrito)
    .map(([id, cantidad]) => ({ producto: productos.find((p) => p.id === Number(id)), cantidad }))
    .filter((l): l is LineaCarrito => l.producto !== undefined);

  function cambiarCantidad(productoId: number, cantidad: number) {
    setCarrito((prev) => {
      const siguiente = { ...prev };
      if (cantidad > 0) siguiente[productoId] = cantidad;
      else delete siguiente[productoId];
      return siguiente;
    });
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEnviando(true);
    setMensaje(null);
    try {
      const pedido = await pedidosApi.crear({
        nombreCliente,
        tipo,
        numeroMesa: tipo === "EN_MESA" ? Number(numeroMesa) : null,
        direccionEntrega: tipo === "DOMICILIO" ? direccionEntrega.trim() : null,
        metodoPago: tipo === "DOMICILIO" ? metodoPago : null,
        observaciones: observaciones || undefined,
        items: lineas.map((l) => ({ productoId: l.producto.id, cantidad: l.cantidad })),
      });
      setNombreCliente("");
      setNumeroMesa("");
      setDireccionEntrega("");
      setMetodoPago("EFECTIVO");
      setObservaciones("");
      setCarrito({});
      setMensaje({ tone: "success", text: `Pedido #${pedido.id} registrado por ${formatMoney(pedido.total)}.` });
      onCreated();
    } catch (error) {
      setMensaje({ tone: "error", text: describeError(error) });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Cliente">
        <Input required maxLength={120} value={nombreCliente} onChange={(e) => setNombreCliente(e.target.value)} placeholder="Nombre del cliente" />
      </Field>

      <div>
        <span className="mb-1 block text-sm font-medium text-stone-700">Tipo de pedido</span>
        <div className="grid grid-cols-3 gap-1 rounded-lg bg-stone-100 p-1" role="radiogroup">
          {opciones(TIPOS_PEDIDO).map((t) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={tipo === t}
              onClick={() => setTipo(t)}
              className={cn(
                "rounded-md px-2 py-1.5 text-sm font-medium transition",
                tipo === t ? "bg-white text-stone-900 shadow-sm" : "text-stone-600 hover:text-stone-900",
              )}
            >
              {TIPOS_PEDIDO[t]}
            </button>
          ))}
        </div>
      </div>

      {tipo === "EN_MESA" && (
        <Field label="Número de mesa">
          <Input required type="number" min={1} value={numeroMesa} onChange={(e) => setNumeroMesa(e.target.value)} className="w-32" />
        </Field>
      )}

      {tipo === "DOMICILIO" && (
        <>
          <Field label="Dirección de entrega">
            <Input
              required
              maxLength={250}
              value={direccionEntrega}
              onChange={(e) => setDireccionEntrega(e.target.value)}
              placeholder="Av. Principal 123, Dpto 401"
            />
          </Field>

          <div>
            <span className="mb-1 block text-sm font-medium text-stone-700">Método de pago</span>
            <div className="grid grid-cols-1 gap-1 rounded-lg bg-stone-100 p-1 sm:grid-cols-3" role="radiogroup" aria-label="Método de pago">
              {opciones(METODOS_PAGO).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={metodoPago === m}
                  onClick={() => setMetodoPago(m)}
                  className={cn(
                    "rounded-md px-2 py-1.5 text-sm font-medium transition",
                    metodoPago === m ? "bg-white text-stone-900 shadow-sm" : "text-stone-600 hover:text-stone-900",
                  )}
                >
                  {METODOS_PAGO[m]}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="space-y-2">
        <span className="block text-sm font-medium text-stone-700">Productos</span>
        <ProductoPicker
          productos={productos}
          enCarrito={carrito}
          onAgregar={(p) => cambiarCantidad(p.id, (carrito[p.id] ?? 0) + 1)}
        />
        <Carrito lineas={lineas} onCambiarCantidad={cambiarCantidad} />
      </div>

      <Field label="Observaciones" hint="Opcional: alergias, término de la carne, etc.">
        <Textarea maxLength={500} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
      </Field>

      {mensaje && <Alert tone={mensaje.tone} message={mensaje.text} onClose={() => setMensaje(null)} />}

      <Button type="submit" loading={enviando} disabled={lineas.length === 0} className="w-full">
        Registrar pedido
      </Button>
    </form>
  );
}
