"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { usingDemoData } from "@/lib/data-service";

const NAV_ITEMS = [
  { href: "/", label: "Resumen", icon: "🏠" },
  { href: "/clients", label: "Clientes", icon: "👤" },
  { href: "/payments", label: "Pagos", icon: "💳" },
  { href: "/attendance", label: "Asistencia", icon: "✅" },
  { href: "/plans", label: "Planes", icon: "📋" },
];

export default function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen w-full flex-col bg-zinc-50 md:flex-row">
      <aside className="hidden w-60 shrink-0 border-r border-zinc-200 bg-white md:flex md:flex-col">
        <div className="px-5 py-6">
          <p className="text-lg font-bold text-zinc-900">💪 FitManager</p>
          <p className="text-xs text-zinc-500">Gestion de entrenador personal</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        {usingDemoData && (
          <div className="m-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
            Modo demo: datos guardados solo en este navegador. Conecta Supabase
            para usar datos reales.
          </div>
        )}
      </aside>

      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 md:hidden">
        <p className="text-base font-bold text-zinc-900">💪 FitManager</p>
        {usingDemoData && (
          <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold text-amber-800">
            DEMO
          </span>
        )}
      </header>

      <main className="flex-1 overflow-y-auto pb-20 md:pb-6">
        <div className="mx-auto w-full max-w-5xl p-4 sm:p-6">{children}</div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-zinc-200 bg-white md:hidden">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
                active ? "text-zinc-900" : "text-zinc-400"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
