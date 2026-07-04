"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  Dumbbell,
  LayoutDashboard,
  Users,
  CreditCard,
  CalendarCheck,
  ClipboardList,
  LogOut,
} from "lucide-react";
import { usingDemoData } from "@/lib/data-service";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";

const NAV_ITEMS = [
  { href: "/", label: "Resumen", Icon: LayoutDashboard },
  { href: "/clients", label: "Clientes", Icon: Users },
  { href: "/payments", label: "Pagos", Icon: CreditCard },
  { href: "/attendance", label: "Asistencia", Icon: CalendarCheck },
  { href: "/plans", label: "Planes", Icon: ClipboardList },
];

export default function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [authChecked, setAuthChecked] = useState(!isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthChecked(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !authChecked) return;
    if (!session && pathname !== "/login") {
      router.replace("/login");
    } else if (session && pathname === "/login") {
      router.replace("/");
    }
  }, [session, authChecked, pathname, router]);

  async function handleLogout() {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (pathname === "/login") {
    return <>{children}</>;
  }

  if (isSupabaseConfigured && !authChecked) {
    return <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-sm text-zinc-500">Cargando...</div>;
  }

  if (isSupabaseConfigured && !session) {
    return null;
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-zinc-50 md:flex-row">
      <aside className="hidden w-60 shrink-0 border-r border-zinc-200 bg-white md:flex md:flex-col">
        <div className="flex items-center gap-2.5 px-5 py-6">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm shadow-violet-200">
            <Dumbbell size={18} strokeWidth={2.5} />
          </span>
          <div>
            <p className="text-base font-bold leading-tight text-zinc-900">FitManager</p>
            <p className="text-xs text-zinc-500">By Gabriel</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {NAV_ITEMS.map(({ href, label, Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-violet-600 text-white shadow-sm shadow-violet-200"
                    : "text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                <Icon size={17} strokeWidth={2.25} />
                {label}
              </Link>
            );
          })}
        </nav>
        {usingDemoData ? (
          <div className="m-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
            Modo demo: datos guardados solo en este navegador. Conecta Supabase
            para usar datos reales.
          </div>
        ) : (
          session && (
            <div className="m-3 flex items-center justify-between gap-2 rounded-lg bg-zinc-50 p-3">
              <p className="truncate text-xs text-zinc-500">{session.user.email}</p>
              <button
                onClick={handleLogout}
                className="flex shrink-0 items-center gap-1 text-xs font-medium text-zinc-600 hover:text-zinc-900"
              >
                <LogOut size={13} /> Salir
              </button>
            </div>
          )
        )}
      </aside>

      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-white">
            <Dumbbell size={16} strokeWidth={2.5} />
          </span>
          <div>
            <p className="text-base font-bold leading-tight text-zinc-900">FitManager</p>
            <p className="text-[10px] leading-tight text-zinc-500">By Gabriel</p>
          </div>
        </div>
        {usingDemoData ? (
          <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold text-amber-800">
            DEMO
          </span>
        ) : (
          session && (
            <button onClick={handleLogout} className="flex items-center gap-1 text-xs font-medium text-zinc-600">
              <LogOut size={13} /> Salir
            </button>
          )
        )}
      </header>

      <main className="flex-1 overflow-y-auto pb-20 md:pb-6">
        <div className="mx-auto w-full max-w-5xl p-4 sm:p-6">{children}</div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-zinc-200 bg-white/95 backdrop-blur md:hidden">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
                active ? "text-violet-600" : "text-zinc-400"
              }`}
            >
              <Icon size={19} strokeWidth={active ? 2.5 : 2} />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
