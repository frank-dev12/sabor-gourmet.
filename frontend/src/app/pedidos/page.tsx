import type { Metadata } from "next";
import { PedidosView } from "@/components/pedidos/PedidosView";

export const metadata: Metadata = { title: "Pedidos" };

export default function PedidosPage() {
  return <PedidosView />;
}
