"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, RotateCcw, Search, Users } from "lucide-react";
import Avatar from "@/components/Avatar";
import EmptyState from "@/components/EmptyState";
import ClientCalendarModal from "@/components/ClientCalendarModal";
import { ListSkeleton } from "@/components/Skeleton";
import {
  checkInClient,
  deleteAttendance,
  findLatestPeriod,
  findPeriodForDate,
  listAttendance,
  listClients,
  listPayments,
  listPlans,
  planForPeriod,
  sessionsUsedInPeriod,
} from "@/lib/data-service";
import { formatDate, todayISO } from "@/lib/format";
import { AttendanceRecord, Client, Payment, Plan } from "@/lib/types";

export default function AttendancePage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [busyId, setBusyId] = useState<string | null>(null);
  const [calendarClient, setCalendarClient] = useState<Client | null>(null);

  async function refresh() {
    const [c, p, pl, a] = await Promise.all([listClients(), listPayments(), listPlans(), listAttendance()]);
    setClients(c.filter((client) => client.status === "active"));
    setPayments(p);
    setPlans(pl);
    setAttendance(a);
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  const today = todayISO();
  const isToday = selectedDate === today;

  const attendanceOnSelectedDate = useMemo(
    () => new Set(attendance.filter((a) => a.checked_in_at.slice(0, 10) === selectedDate).map((a) => a.client_id)),
    [attendance, selectedDate]
  );

  const filteredClients = clients.filter((c) =>
    c.full_name.toLowerCase().includes(search.toLowerCase())
  );

  async function handleToggle(client: Client) {
    setBusyId(client.id);
    try {
      const existing = attendance.find(
        (a) => a.client_id === client.id && a.checked_in_at.slice(0, 10) === selectedDate
      );
      if (existing) {
        await deleteAttendance(existing.id);
        setAttendance((prev) => prev.filter((a) => a.id !== existing.id));
      } else {
        const created = await checkInClient(client.id, selectedDate);
        setAttendance((prev) => [created, ...prev]);
      }
    } finally {
      setBusyId(null);
    }
  }

  const calendarPeriod = calendarClient ? findLatestPeriod(payments, calendarClient.id) : null;
  const calendarPlan = calendarPeriod ? planForPeriod(calendarPeriod, plans, calendarClient?.plan) : null;
  const calendarAttendedDates = useMemo(() => {
    if (!calendarClient) return new Set<string>();
    return new Set(
      attendance
        .filter((a) => a.client_id === calendarClient.id)
        .map((a) => a.checked_in_at.slice(0, 10))
    );
  }, [attendance, calendarClient]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-50">Asistencia</h1>
        <p className="text-sm text-zinc-400">
          {attendanceOnSelectedDate.size} de {clients.length} clientes activos marcados{" "}
          {isToday ? "hoy" : `el ${formatDate(selectedDate)}`}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="date"
          value={selectedDate}
          max={today}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="input w-auto"
        />
        {!isToday && (
          <button onClick={() => setSelectedDate(today)} className="btn-secondary">
            <RotateCcw size={13} /> Hoy
          </button>
        )}
        <p className="w-full text-xs text-zinc-400 sm:w-auto sm:flex-1">
          ¿Se te olvido marcar un dia? Elige la fecha y marca la asistencia atrasada, no tiene que ser hoy.
        </p>
      </div>

      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar cliente..."
          className="input pl-9"
        />
      </div>

      {loading ? (
        <ListSkeleton rows={3} />
      ) : filteredClients.length === 0 ? (
        <EmptyState icon={Users} title="No hay clientes activos que coincidan" />
      ) : (
        <ul className="flex flex-col gap-2">
          {filteredClients.map((client) => {
            const marked = attendanceOnSelectedDate.has(client.id);
            const period = findPeriodForDate(payments, client.id, selectedDate);
            const plan = period ? planForPeriod(period, plans, client.plan) : null;
            const target = plan?.sessions_per_period ?? null;
            const used = period ? sessionsUsedInPeriod(attendance, client.id, period) : 0;
            const pct = target ? Math.min(100, Math.round((used / target) * 100)) : 0;

            return (
              <li
                key={client.id}
                onClick={() => setCalendarClient(client)}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 shadow-sm transition-colors hover:border-emerald-500/40 ${
                  marked ? "border-emerald-500/30 bg-emerald-500/10" : "border-zinc-800 bg-zinc-900"
                }`}
              >
                <Avatar name={client.full_name} size={38} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-50">{client.full_name}</p>
                  {period && target ? (
                    <div className="mt-1 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-800">
                        <div
                          className={`h-full rounded-full ${pct >= 100 ? "bg-emerald-500" : "bg-blue-500"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="shrink-0 text-[11px] font-medium text-zinc-400">
                        {used} de {target}
                      </span>
                    </div>
                  ) : (
                    <p className="mt-0.5 text-[11px] text-amber-400">
                      Sin periodo de pago activo en esta fecha
                    </p>
                  )}
                </div>
                <button
                  disabled={busyId === client.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggle(client);
                  }}
                  className={`flex shrink-0 items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
                    marked
                      ? "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/20"
                      : "bg-emerald-600 text-white hover:bg-emerald-700"
                  }`}
                >
                  {marked ? (
                    <>
                      <CheckCircle2 size={14} /> Asistio
                    </>
                  ) : busyId === client.id ? (
                    "..."
                  ) : (
                    "Marcar"
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {calendarClient && (
        <ClientCalendarModal
          client={calendarClient}
          period={calendarPeriod}
          plan={calendarPlan}
          attendedDates={calendarAttendedDates}
          onClose={() => setCalendarClient(null)}
        />
      )}
    </div>
  );
}
