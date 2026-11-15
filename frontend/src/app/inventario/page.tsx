import type { Metadata } from "next";
import { InventarioView } from "@/components/inventario/InventarioView";

export const metadata: Metadata = { title: "Inventario" };

export default function InventarioPage() {
  return <InventarioView />;
}
