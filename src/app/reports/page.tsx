"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Receipt } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { ListSkeleton } from "@/components/Skeleton";
import { listPayments } from "@/lib/data-service";
import { formatCurrency, formatDate, todayISO } from "@/lib/format";
import { MONTH_NAMES } from "@/lib/calendar-utils";
import { Payment } from "@/lib/types";

export default function ReportsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthOffset, setMonthOffset] = useState(0);

  useEffect(() => {
    listPayments()
      .then(setPayments)
      .finally(() => setLoading(false));
  }, []);

  const selectedMonthDate = useMemo(() => {
    const d = new Date(`${todayISO()}T00:00:00`);
    d.setDate(1);
    d.setMonth(d.getMonth() + monthOffset);
    return d;
  }, [monthOffset]);
  const selectedMonthKey = `${selectedMonthDate.getFullYear()}-${String(selectedMonthDate.getMonth() + 1).padStart(2, "0")}`;
  const selectedMonthLabel = `${MONTH_NAMES[selectedMonthDate.getMonth()]} ${selectedMonthDate.getFullYear()}`;

  const monthPayments = useMemo(
    () =>
      payments
        .filter((p) => p.payment_date.startsWith(selectedMonthKey) && p.paid)
        .sort((a, b) => (a.payment_date < b.payment_date ? -1 : 1)),
    [payments, selectedMonthKey]
  );
  const total = monthPayments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-2xl font-bold text-transparent">
          Historial de ingresos
        </h1>
        <p className="text-sm text-zinc-400">Todos los pagos registrados, mes a mes</p>
      </div>

      <div className="card flex items-center justify-between p-3">
        <button
          onClick={() => setMonthOffset((o) => o - 1)}
          className="rounded-lg border border-zinc-700 bg-zinc-800 p-2 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-700"
          aria-label="Mes anterior"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-lg font-semibold capitalize text-zinc-50">{selectedMonthLabel}</span>
        <button
          onClick={() => setMonthOffset((o) => Math.min(o + 1, 0))}
          disabled={monthOffset >= 0}
          className="rounded-lg border border-zinc-700 bg-zinc-800 p-2 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-700 disabled:opacity-30"
          aria-label="Mes siguiente"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {loading ? (
        <ListSkeleton />
      ) : monthPayments.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="Sin pagos este mes"
          description="No hay ingresos registrados en este periodo."
        />
      ) : (
        <div className="card overflow-hidden">
          <ul className="divide-y divide-zinc-800">
            {monthPayments.map((p) => (
              <li key={p.id} className="flex items-center gap-3 p-3">
                <span className="w-28 shrink-0 font-semibold text-emerald-400">
                  {formatCurrency(p.amount)}
                </span>
                <span className="truncate text-zinc-200">{p.client?.full_name ?? "Cliente eliminado"}</span>
                <span className="ml-auto shrink-0 text-xs text-zinc-500">{formatDate(p.payment_date)}</span>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between border-t border-zinc-800 bg-zinc-950/40 p-4">
            <span className="font-semibold text-zinc-50">Total</span>
            <span className="text-lg font-bold text-emerald-400">{formatCurrency(total)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
