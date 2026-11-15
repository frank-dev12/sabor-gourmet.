"use client";

import { useCallback, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState, LoadingRows } from "@/components/ui/States";
import { useApiData } from "@/hooks/useApiData";
import { describeError, pedidosApi, productosApi } from "@/lib/api";
import { cn } from "@/lib/cn";
import { ESTADOS_PEDIDO, opciones } from "@/lib/labels";
import type { EstadoPedido, Pedido } from "@/lib/types";
import { NuevoPedidoForm } from "./NuevoPedidoForm";
import { PedidoCard } from "./PedidoCard";

export function PedidosView() {
  const [filtro, setFiltro] = useState<EstadoPedido | undefined>(undefined);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);

  const cargarProductos = useCallback(() => productosApi.listar({ disponibles: true }), []);
  const cargarPedidos = useCallback(() => pedidosApi.listar(filtro), [filtro]);
  const productos = useApiData(cargarProductos);
  const pedidos = useApiData(cargarPedidos);

  const recargarTodo = () => {
    productos.reload();
    pedidos.reload();
  };

  async function cambiarEstado(pedido: Pedido, estado: EstadoPedido) {
    setErrorAccion(null);
    try {
      await pedidosApi.cambiarEstado(pedido.id, estado);
      // Cancelar repone stock, así que también se refresca la lista de productos.
      recargarTodo();
    } catch (e) {
      setErrorAccion(describeError(e));
    }
  }

  const error = errorAccion ?? pedidos.error;

  return (
    <>
      <PageHeader title="Pedidos" description="Registra pedidos y sigue su avance hasta la entrega." />

      <div className="grid items-start gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader title="Nuevo pedido" description="El stock se descuenta al registrarlo." />
          <CardBody>
            {productos.error && <Alert message={productos.error} />}
            {productos.loading ? (
              <LoadingRows rows={4} />
            ) : (
              <NuevoPedidoForm productos={productos.data ?? []} onCreated={recargarTodo} />
            )}
          </CardBody>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader
            title="Pedidos"
            actions={
              <Button size="sm" variant="ghost" onClick={pedidos.reload}>
                Actualizar
              </Button>
            }
          />
          <CardBody className="space-y-4">
            <div className="flex flex-wrap gap-1.5">
              {[undefined, ...opciones(ESTADOS_PEDIDO)].map((estado) => (
                <button
                  key={estado ?? "TODOS"}
                  type="button"
                  onClick={() => setFiltro(estado)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset transition",
                    filtro === estado
                      ? "bg-stone-900 text-white ring-stone-900"
                      : "bg-white text-stone-600 ring-stone-300 hover:bg-stone-50",
                  )}
                >
                  {estado ? ESTADOS_PEDIDO[estado].label : "Todos"}
                </button>
              ))}
            </div>

            {error && <Alert message={error} onClose={errorAccion ? () => setErrorAccion(null) : undefined} />}

            {pedidos.loading ? (
              <LoadingRows />
            ) : pedidos.data && pedidos.data.length > 0 ? (
              <div className="grid gap-3 xl:grid-cols-2">
                {pedidos.data.map((p) => (
                  <PedidoCard key={p.id} pedido={p} onCambiarEstado={cambiarEstado} />
                ))}
              </div>
            ) : (
              !pedidos.error && <EmptyState title="No hay pedidos" description={filtro ? "Prueba con otro estado." : undefined} />
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
