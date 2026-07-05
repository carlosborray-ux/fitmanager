"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Users,
  CalendarCheck,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Wallet,
  PartyPopper,
  CheckCircle2,
  CreditCard,
  UserPlus,
  AlertTriangle,
} from "lucide-react";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import Avatar from "@/components/Avatar";
import EmptyState from "@/components/EmptyState";
import { CardGridSkeleton } from "@/components/Skeleton";
import { MONTH_NAMES } from "@/lib/calendar-utils";
import { getDashboardSummary, listClassSessions } from "@/lib/data-service";
import { ClassSession, DashboardSummary } from "@/lib/types";
import { daysUntil, formatCurrency, formatDate, todayISO } from "@/lib/format";

const MAX_VISIBLE_INSTALLMENTS = 8;

function installmentAlarm(remaining: number, dueDateISO: string) {
  if (remaining < 0) {
    const days = Math.abs(remaining);
    return { label: `Vencida hace ${days} dia${days === 1 ? "" : "s"}`, tone: "bg-red-500/15 text-red-400" };
  }
  if (remaining === 0) {
    return { label: "Vence hoy", tone: "bg-red-500/15 text-red-400" };
  }
  if (remaining <= 3) {
    return { label: `Vence en ${remaining} dia${remaining === 1 ? "" : "s"}`, tone: "bg-amber-500/15 text-amber-400" };
  }
  if (remaining <= 7) {
    return { label: `Vence en ${remaining} dias`, tone: "bg-zinc-800 text-zinc-300" };
  }
  return { label: `Vence el ${formatDate(dueDateISO)}`, tone: "bg-zinc-800 text-zinc-300" };
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [todaySessions, setTodaySessions] = useState<ClassSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthOffset, setMonthOffset] = useState(0);

  useEffect(() => {
    Promise.all([getDashboardSummary(), listClassSessions()])
      .then(([s, sessions]) => {
        setSummary(s);
        setTodaySessions(
          sessions
            .filter((session) => session.date === todayISO())
            .sort((a, b) => (a.start_time < b.start_time ? -1 : 1))
        );
      })
      .finally(() => setLoading(false));
  }, []);

  const payments = summary?.payments ?? [];

  const selectedMonthDate = useMemo(() => {
    const d = new Date(`${todayISO()}T00:00:00`);
    d.setDate(1);
    d.setMonth(d.getMonth() + monthOffset);
    return d;
  }, [monthOffset]);
  const selectedMonthKey = `${selectedMonthDate.getFullYear()}-${String(selectedMonthDate.getMonth() + 1).padStart(2, "0")}`;
  const selectedMonthLabel = `${MONTH_NAMES[selectedMonthDate.getMonth()]} ${selectedMonthDate.getFullYear()}`;
  const selectedMonthPayments = payments.filter(
    (p) => p.payment_date.startsWith(selectedMonthKey) && p.paid
  );
  const selectedMonthRevenue = selectedMonthPayments.reduce((sum, p) => sum + p.amount, 0);

  const pendingInstallments = useMemo(() => {
    return payments
      .filter((p) => !p.paid)
      .map((p) => ({ ...p, remaining: daysUntil(p.payment_date) }))
      .sort((a, b) => a.remaining - b.remaining);
  }, [payments]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-50">Resumen</h1>
        <p className="text-sm text-zinc-400">
          Vista general de tus clientes, pagos y asistencia.
        </p>
      </div>

      {loading || !summary ? (
        <CardGridSkeleton />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Clientes activos" value={String(summary.activeClients)} icon={Users} accent="violet" />
            <StatCard label="Clientes totales" value={String(summary.totalClients)} icon={Users} accent="blue" />
            <StatCard label="Asistencias hoy" value={String(summary.attendanceToday)} icon={CalendarCheck} accent="green" />
            <StatCard
              label="Ingresos del mes"
              value={formatCurrency(summary.revenueThisMonth)}
              icon={Wallet}
              accent="amber"
            />
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-zinc-50">Ingresos por mes</h2>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setMonthOffset((o) => o - 1)}
                  className="rounded-lg border border-zinc-800 p-1.5 hover:bg-zinc-950"
                  aria-label="Mes anterior"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="w-28 text-center text-sm font-medium capitalize text-zinc-300">
                  {selectedMonthLabel}
                </span>
                <button
                  onClick={() => setMonthOffset((o) => Math.min(o + 1, 0))}
                  disabled={monthOffset >= 0}
                  className="rounded-lg border border-zinc-800 p-1.5 hover:bg-zinc-950 disabled:opacity-30"
                  aria-label="Mes siguiente"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-amber-400">{formatCurrency(selectedMonthRevenue)}</p>
            <p className="text-xs text-zinc-400">
              {selectedMonthPayments.length} pago{selectedMonthPayments.length === 1 ? "" : "s"} registrado
              {selectedMonthPayments.length === 1 ? "" : "s"} este mes
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-zinc-50">Cuotas pendientes ({pendingInstallments.length})</h2>
              <Link href="/payments" className="text-sm font-medium text-violet-400 hover:underline">
                Ver pagos
              </Link>
            </div>
            {pendingInstallments.length === 0 ? (
              <EmptyState
                icon={PartyPopper}
                title="No hay cuotas pendientes"
                description="Ninguna compra tiene cuotas por vencer."
              />
            ) : (
              <>
                <ul className="divide-y divide-zinc-800">
                  {pendingInstallments.slice(0, MAX_VISIBLE_INSTALLMENTS).map((p) => {
                    const { label, tone } = installmentAlarm(p.remaining, p.payment_date);
                    return (
                      <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                        <div className="flex items-center gap-3">
                          <Avatar name={p.client?.full_name ?? "?"} size={36} />
                          <div>
                            <p className="text-sm font-medium text-zinc-50">
                              {p.client?.full_name ?? "Cliente eliminado"}
                            </p>
                            <p className="text-xs text-zinc-400">
                              Cuota {p.installment_number} de {p.installment_count} · {formatCurrency(p.amount)}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${tone}`}
                        >
                          <AlertTriangle size={12} /> {label}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                {pendingInstallments.length > MAX_VISIBLE_INSTALLMENTS && (
                  <p className="pt-2 text-xs text-zinc-400">
                    +{pendingInstallments.length - MAX_VISIBLE_INSTALLMENTS} cuota
                    {pendingInstallments.length - MAX_VISIBLE_INSTALLMENTS === 1 ? "" : "s"} mas en Pagos
                  </p>
                )}
              </>
            )}
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-zinc-50">Clases de hoy ({todaySessions.length})</h2>
              <Link href="/calendar" className="text-sm font-medium text-violet-400 hover:underline">
                Ver calendario
              </Link>
            </div>
            {todaySessions.length === 0 ? (
              <EmptyState icon={CalendarClock} title="No tienes clases agendadas hoy" />
            ) : (
              <ul className="divide-y divide-zinc-800">
                {todaySessions.map((session) => {
                  const attendeeNames = [
                    ...session.clients.map((c) => c.full_name),
                    ...session.guests.map((g) => `${g} (cortesia)`),
                  ];
                  return (
                    <li key={session.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div>
                        <p className="text-sm font-medium text-zinc-50">
                          {session.start_time} - {session.end_time}
                          {session.title ? ` · ${session.title}` : ""}
                        </p>
                        {attendeeNames.length > 0 && (
                          <p className="text-xs text-zinc-400">{attendeeNames.join(", ")}</p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-zinc-50">
                Pagos vencidos o pendientes ({summary.overdueClients.length})
              </h2>
              <Link href="/payments" className="text-sm font-medium text-violet-400 hover:underline">
                Registrar pago
              </Link>
            </div>
            {summary.overdueClients.length === 0 ? (
              <EmptyState
                icon={PartyPopper}
                title="Todos al dia"
                description="Ningun cliente activo tiene pagos vencidos."
              />
            ) : (
              <ul className="divide-y divide-zinc-800">
                {summary.overdueClients.map((client) => (
                  <li key={client.id} className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-3">
                      <Avatar name={client.full_name} size={36} />
                      <div>
                        <p className="text-sm font-medium text-zinc-50">{client.full_name}</p>
                        <p className="text-xs text-zinc-400">{client.plan?.name ?? "Sin plan"}</p>
                      </div>
                    </div>
                    <StatusBadge status={client.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>

          {(summary.clientsWithOneSessionLeft.length > 0 || summary.clientsWithTwoSessionsLeft.length > 0) && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 shadow-sm">
              <h2 className="mb-3 font-semibold text-zinc-50">Por renovar pronto</h2>
              <ul className="divide-y divide-zinc-800">
                {summary.clientsWithOneSessionLeft.map((client) => (
                  <li key={client.id} className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-3">
                      <Avatar name={client.full_name} size={36} />
                      <div>
                        <p className="text-sm font-medium text-zinc-50">{client.full_name}</p>
                        <p className="text-xs text-zinc-400">{client.plan?.name ?? "Sin plan"}</p>
                      </div>
                    </div>
                    <span className="flex items-center gap-1 rounded-full bg-red-500/15 px-2.5 py-0.5 text-xs font-medium text-red-400">
                      <AlertTriangle size={12} /> Le queda 1 sesion
                    </span>
                  </li>
                ))}
                {summary.clientsWithTwoSessionsLeft.map((client) => (
                  <li key={client.id} className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-3">
                      <Avatar name={client.full_name} size={36} />
                      <div>
                        <p className="text-sm font-medium text-zinc-50">{client.full_name}</p>
                        <p className="text-xs text-zinc-400">{client.plan?.name ?? "Sin plan"}</p>
                      </div>
                    </div>
                    <span className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-medium text-amber-400">
                      <AlertTriangle size={12} /> Le quedan 2 sesiones
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Link
          href="/attendance"
          className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-sm font-medium text-zinc-50 shadow-sm transition-shadow hover:shadow-md"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
            <CheckCircle2 size={18} />
          </span>
          Marcar asistencia
        </Link>
        <Link
          href="/payments"
          className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-sm font-medium text-zinc-50 shadow-sm transition-shadow hover:shadow-md"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400">
            <CreditCard size={18} />
          </span>
          Registrar pago
        </Link>
        <Link
          href="/clients"
          className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-sm font-medium text-zinc-50 shadow-sm transition-shadow hover:shadow-md"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/15 text-violet-400">
            <UserPlus size={18} />
          </span>
          Agregar cliente
        </Link>
      </div>
    </div>
  );
}
