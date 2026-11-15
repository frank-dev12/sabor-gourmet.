import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { AppHeader } from "@/components/layout/AppHeader";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Sabor Gourmet",
    template: "%s · Sabor Gourmet",
  },
  description: "Gestión de inventario, pedidos y reservas del restaurante Sabor Gourmet",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${geistSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-stone-50 text-stone-900">
        <AppHeader />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">{children}</main>
      </body>
    </html>
  );
}
