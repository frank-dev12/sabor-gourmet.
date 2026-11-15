"use client";

import { useCallback, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Select } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState, LoadingRows } from "@/components/ui/States";
import { useApiData } from "@/hooks/useApiData";
import { describeError, productosApi } from "@/lib/api";
import { CATEGORIAS, opciones } from "@/lib/labels";
import type { CategoriaProducto, Producto } from "@/lib/types";
import { ProductoCards } from "./ProductoCards";
import { ProductoForm } from "./ProductoForm";
import { ProductosTable } from "./ProductosTable";
import { STOCK_BAJO } from "./StockBadge";

export function InventarioView() {
  const [categoria, setCategoria] = useState<CategoriaProducto | "">("");
  const [soloDisponibles, setSoloDisponibles] = useState(false);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);

  const cargar = useCallback(
    () => productosApi.listar({ categoria: categoria || undefined, disponibles: soloDisponibles }),
    [categoria, soloDisponibles],
  );
  const { data: productos, error, loading, reload } = useApiData(cargar);

  async function ajustarStock(producto: Producto, cantidad: number) {
    setErrorAccion(null);
    try {
      await productosApi.ajustarStock(producto.id, cantidad);
      reload();
    } catch (e) {
      setErrorAccion(describeError(e));
    }
  }

  async function desactivar(producto: Producto) {
    if (!confirm(`¿Desactivar "${producto.nombre}"? Dejará de poder pedirse.`)) return;
    setErrorAccion(null);
    try {
      await productosApi.desactivar(producto.id);
      reload();
    } catch (e) {
      setErrorAccion(describeError(e));
    }
  }

  const activos = productos?.filter((p) => p.activo) ?? [];
  const stockBajo = activos.filter((p) => p.stock <= STOCK_BAJO).length;

  return (
    <>
      <PageHeader title="Inventario" description="Productos de la carta y su stock disponible." />

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader title="Nuevo producto" />
          <CardBody>
            <ProductoForm onCreated={reload} />
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Productos"
            description={
              productos
                ? `${activos.length} activos${stockBajo ? ` · ${stockBajo} con stock bajo o agotado` : ""}`
                : undefined
            }
            actions={
              <>
                <Select
                  aria-label="Filtrar por categoría"
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value as CategoriaProducto | "")}
                  className="h-9 w-44"
                >
                  <option value="">Todas las categorías</option>
                  {opciones(CATEGORIAS).map((c) => (
                    <option key={c} value={c}>
                      {CATEGORIAS[c]}
                    </option>
                  ))}
                </Select>
                <label className="flex items-center gap-2 text-sm text-stone-600">
                  <input
                    type="checkbox"
                    checked={soloDisponibles}
                    onChange={(e) => setSoloDisponibles(e.target.checked)}
                    className="size-4 rounded border-stone-300 accent-amber-600"
                  />
                  Solo con stock
                </label>
                <Button size="sm" variant="ghost" onClick={reload}>
                  Actualizar
                </Button>
              </>
            }
          />
          <CardBody className="space-y-4">
            {(error || errorAccion) && (
              <Alert message={(errorAccion ?? error)!} onClose={errorAccion ? () => setErrorAccion(null) : undefined} />
            )}
            {loading ? (
              <LoadingRows />
            ) : productos && productos.length > 0 ? (
              <>
                <div className="hidden md:block">
                  <ProductosTable productos={productos} onAjustarStock={ajustarStock} onDesactivar={desactivar} />
                </div>
                <ProductoCards className="md:hidden" productos={productos} onAjustarStock={ajustarStock} onDesactivar={desactivar} />
              </>
            ) : (
              !error && <EmptyState title="No hay productos" description="Agrega el primero con el formulario." />
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
