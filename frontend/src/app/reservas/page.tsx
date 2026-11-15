import type { Metadata } from "next";
import { connection } from "next/server";
import { ReservasView } from "@/components/reservas/ReservasView";
import { hoyISO } from "@/lib/format";

export const metadata: Metadata = { title: "Reservas" };

export default async function ReservasPage() {
  await connection();
  return <ReservasView hoy={hoyISO()} />;
}
