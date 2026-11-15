"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const SECCIONES = [
  { href: "/inventario", label: "Inventario" },
  { href: "/pedidos", label: "Pedidos" },
  { href: "/reservas", label: "Reservas" },
] as const;

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="text-base font-semibold tracking-tight whitespace-nowrap text-stone-900 sm:text-lg">
          Sabor <span className="text-amber-600">Gourmet</span>
        </Link>

        <nav className="flex gap-1">
          {SECCIONES.map(({ href, label }) => {
            const activa = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={activa ? "page" : undefined}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  activa ? "bg-amber-50 text-amber-800" : "text-stone-600 hover:bg-stone-100 hover:text-stone-900",
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
