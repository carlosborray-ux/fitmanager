"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import { getDashboardSummary } from "@/lib/data-service";
import { DashboardSummary } from "@/lib/types";
import { formatCurrency } from "@/lib/format";

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardSummary()
      .then(setSummary)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-sm text-zinc-500">Cargando resumen...</p>;
  }

  if (!summary) {
    return <p className="text-sm text-red-600">No se pudo cargar el resumen.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Resumen</h1>
        <p className="text-sm text-zinc-500">
          Vista general de tus clientes, pagos y asistencia.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Clientes activos" value={String(summary.activeClients)} accent="blue" />
        <StatCard label="Clientes totales" value={String(summary.totalClients)} accent="zinc" />
        <StatCard label="Asistencias hoy" value={String(summary.attendanceToday)} accent="green" />
        <StatCard
          label="Ingresos del mes"
          value={formatCurrency(summary.revenueThisMonth)}
          accent="green"
        />
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-zinc-900">
            Pagos vencidos o pendientes ({summary.overdueClients.length})
          </h2>
          <Link href="/payments" className="text-sm font-medium text-blue-600 hover:underline">
            Registrar pago
          </Link>
        </div>
        {summary.overdueClients.length === 0 ? (
          <p className="text-sm text-zinc-500">Todos los clientes activos estan al dia. 🎉</p>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {summary.overdueClients.map((client) => (
              <li key={client.id} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-zinc-900">{client.full_name}</p>
                  <p className="text-xs text-zinc-500">{client.plan?.name ?? "Sin plan"}</p>
                </div>
                <StatusBadge status={client.status} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Link
          href="/attendance"
          className="rounded-xl border border-zinc-200 bg-white p-4 text-sm font-medium text-zinc-900 shadow-sm hover:border-zinc-300"
        >
          ✅ Marcar asistencia
        </Link>
        <Link
          href="/payments"
          className="rounded-xl border border-zinc-200 bg-white p-4 text-sm font-medium text-zinc-900 shadow-sm hover:border-zinc-300"
        >
          💳 Registrar pago
        </Link>
        <Link
          href="/clients"
          className="rounded-xl border border-zinc-200 bg-white p-4 text-sm font-medium text-zinc-900 shadow-sm hover:border-zinc-300"
        >
          👤 Agregar cliente
        </Link>
      </div>
    </div>
  );
}
