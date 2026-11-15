import { Badge } from "@/components/ui/Badge";

export const STOCK_BAJO = 5;

export function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) return <Badge tone="red">Agotado</Badge>;
  if (stock <= STOCK_BAJO) return <Badge tone="amber">{stock} · bajo</Badge>;
  return <Badge tone="green">{stock}</Badge>;
}
