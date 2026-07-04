"use client";

import { useEffect, useState } from "react";
import {
  checkInClient,
  deleteAttendance,
  listAttendance,
  listClients,
} from "@/lib/data-service";
import { formatDateTime, todayISO } from "@/lib/format";
import { AttendanceRecord, Client } from "@/lib/types";

export default function AttendancePage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [checkingIn, setCheckingIn] = useState<string | null>(null);

  async function refresh() {
    const [c, a] = await Promise.all([listClients(), listAttendance()]);
    setClients(c.filter((client) => client.status === "active"));
    setAttendance(a);
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  const today = todayISO();
  const checkedInTodayIds = new Set(
    attendance.filter((a) => a.checked_in_at.startsWith(today)).map((a) => a.client_id)
  );

  const filteredClients = clients.filter((c) =>
    c.full_name.toLowerCase().includes(search.toLowerCase())
  );

  async function handleCheckIn(clientId: string) {
    setCheckingIn(clientId);
    try {
      await checkInClient(clientId);
      await refresh();
    } finally {
      setCheckingIn(null);
    }
  }

  async function handleDelete(id: string) {
    await deleteAttendance(id);
    await refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Asistencia</h1>
        <p className="text-sm text-zinc-500">
          {checkedInTodayIds.size} de {clients.length} clientes activos ya asistieron hoy
        </p>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar cliente para marcar entrada..."
        className="input"
      />

      {loading ? (
        <p className="text-sm text-zinc-500">Cargando...</p>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {filteredClients.map((client) => {
            const already = checkedInTodayIds.has(client.id);
            return (
              <button
                key={client.id}
                disabled={already || checkingIn === client.id}
                onClick={() => handleCheckIn(client.id)}
                className={`flex items-center justify-between rounded-xl border p-3 text-left shadow-sm transition-colors ${
                  already
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-zinc-200 bg-white hover:border-zinc-300"
                }`}
              >
                <span className="text-sm font-medium">{client.full_name}</span>
                <span className="text-xs font-semibold">
                  {already ? "Ya asistio ✓" : checkingIn === client.id ? "..." : "Marcar entrada"}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div>
        <h2 className="mb-2 font-semibold text-zinc-900">Historial reciente</h2>
        {attendance.length === 0 ? (
          <p className="text-sm text-zinc-500">Sin registros de asistencia.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
            <ul className="divide-y divide-zinc-100">
              {attendance.slice(0, 30).map((record) => (
                <li key={record.id} className="flex items-center justify-between p-3">
                  <div>
                    <p className="text-sm font-medium text-zinc-900">
                      {record.client?.full_name ?? "Cliente eliminado"}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {formatDateTime(record.checked_in_at)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(record.id)}
                    className="text-xs font-medium text-red-600 hover:underline"
                  >
                    Eliminar
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
