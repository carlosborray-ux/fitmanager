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
  CalendarDays,
  ClipboardList,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { usingDemoData } from "@/lib/data-service";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";

const NAV_ITEMS = [
  { href: "/", label: "Resumen", Icon: LayoutDashboard },
  { href: "/clients", label: "Clientes", Icon: Users },
  { href: "/calendar", label: "Calendario", Icon: CalendarDays },
  { href: "/payments", label: "Pagos", Icon: CreditCard },
  { href: "/attendance", label: "Asistencia", Icon: CalendarCheck },
  { href: "/plans", label: "Planes", Icon: ClipboardList },
];

export default function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [authChecked, setAuthChecked] = useState(!isSupabaseConfigured);
  const [menuOpen, setMenuOpen] = useState(false);

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

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  async function handleLogout() {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (pathname === "/login") {
    return <>{children}</>;
  }

  if (isSupabaseConfigured && !authChecked) {
    return <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-sm text-zinc-400">Cargando...</div>;
  }

  if (isSupabaseConfigured && !session) {
    return null;
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-zinc-950">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-zinc-800 bg-zinc-900 px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMenuOpen(true)}
            className="rounded-lg p-1.5 text-zinc-300 hover:bg-zinc-800"
            aria-label="Abrir menu"
          >
            <Menu size={20} />
          </button>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-sm shadow-violet-950/50">
            <Dumbbell size={16} strokeWidth={2.5} />
          </span>
          <div>
            <p className="bg-gradient-to-r from-violet-300 to-fuchsia-300 bg-clip-text text-base font-bold leading-tight text-transparent">
              FitManager
            </p>
            <p className="text-[10px] leading-tight text-zinc-400">By Gabriel</p>
          </div>
        </div>
        {usingDemoData ? (
          <span className="rounded-full bg-amber-500/15 px-2 py-1 text-[10px] font-semibold text-amber-300">
            DEMO
          </span>
        ) : (
          session && (
            <button onClick={handleLogout} className="flex items-center gap-1 text-xs font-medium text-zinc-400">
              <LogOut size={13} /> Salir
            </button>
          )
        )}
      </header>

      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[1px]"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 max-w-[80vw] flex-col border-r border-zinc-800 bg-zinc-900 shadow-xl transition-transform duration-200 ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-sm shadow-violet-950/50">
              <Dumbbell size={18} strokeWidth={2.5} />
            </span>
            <div>
              <p className="bg-gradient-to-r from-violet-300 to-fuchsia-300 bg-clip-text text-base font-bold leading-tight text-transparent">
                FitManager
              </p>
              <p className="text-xs text-zinc-400">By Gabriel</p>
            </div>
          </div>
          <button
            onClick={() => setMenuOpen(false)}
            className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-50"
            aria-label="Cerrar menu"
          >
            <X size={18} />
          </button>
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
                    ? "bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white shadow-sm shadow-violet-950/50"
                    : "text-zinc-400 hover:bg-zinc-800"
                }`}
              >
                <Icon size={17} strokeWidth={2.25} />
                {label}
              </Link>
            );
          })}
        </nav>
        {usingDemoData ? (
          <div className="m-3 rounded-lg bg-amber-500/10 p-3 text-xs text-amber-300">
            Modo demo: datos guardados solo en este navegador. Conecta Supabase
            para usar datos reales.
          </div>
        ) : (
          session && (
            <div className="m-3 flex items-center justify-between gap-2 rounded-lg bg-zinc-950 p-3">
              <p className="truncate text-xs text-zinc-400">{session.user.email}</p>
              <button
                onClick={handleLogout}
                className="flex shrink-0 items-center gap-1 text-xs font-medium text-zinc-400 hover:text-zinc-50"
              >
                <LogOut size={13} /> Salir
              </button>
            </div>
          )
        )}
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-5xl p-4 sm:p-6">{children}</div>
      </main>
    </div>
  );
}
