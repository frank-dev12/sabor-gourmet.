import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";

const MODULOS = [
  {
    href: "/inventario",
    titulo: "Inventario",
    descripcion: "Productos de la carta, precios y stock disponible.",
  },
  {
    href: "/pedidos",
    titulo: "Pedidos",
    descripcion: "Toma pedidos y sigue su estado desde cocina hasta la entrega.",
  },
  {
    href: "/reservas",
    titulo: "Reservas",
    descripcion: "Busca mesas libres y registra reservas sin cruces de horario.",
  },
];

export default function Home() {
  return (
    <>
      <PageHeader title="Panel de operación" description="Elige el módulo con el que quieres trabajar." />
      <div className="grid gap-4 sm:grid-cols-3">
        {MODULOS.map(({ href, titulo, descripcion }) => (
          <Link
            key={href}
            href={href}
            className="group rounded-xl border border-stone-200 bg-white p-5 shadow-sm transition hover:border-amber-300 hover:shadow-md"
          >
            <h2 className="font-semibold text-stone-900 group-hover:text-amber-700">{titulo} →</h2>
            <p className="mt-1 text-sm text-stone-500">{descripcion}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
