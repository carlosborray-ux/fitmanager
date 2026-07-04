"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import Modal from "@/components/Modal";
import Avatar from "@/components/Avatar";
import EmptyState from "@/components/EmptyState";
import { MONTH_NAMES, WEEKDAYS, monthMatrix, toISODate } from "@/lib/calendar-utils";
import {
  deleteClassSession,
  listClassSessions,
  listClients,
  saveClassSession,
} from "@/lib/data-service";
import { formatDate, todayISO } from "@/lib/format";
import { Client, ClassSession } from "@/lib/types";

export default function CalendarPage() {
  const today = todayISO();
  const [cursor, setCursor] = useState(() => {
    const d = new Date(`${today}T00:00:00`);
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [dayModal, setDayModal] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<ClassSession | null>(null);

  const [formDate, setFormDate] = useState(today);
  const [startTime, setStartTime] = useState("07:00");
  const [endTime, setEndTime] = useState("08:00");
  const [title, setTitle] = useState("");
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [clientSearch, setClientSearch] = useState("");

  async function refresh() {
    const [s, c] = await Promise.all([listClassSessions(), listClients()]);
    setSessions(s);
    setClients(c.filter((cl) => cl.status === "active"));
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  const sessionsByDate = useMemo(() => {
    const map = new Map<string, ClassSession[]>();
    for (const s of sessions) {
      const arr = map.get(s.date) ?? [];
      arr.push(s);
      map.set(s.date, arr);
    }
    return map;
  }, [sessions]);

  function goToMonth(delta: number) {
    setCursor((c) => {
      let month = c.month + delta;
      let year = c.year;
      if (month < 0) {
        month = 11;
        year--;
      }
      if (month > 11) {
        month = 0;
        year++;
      }
      return { year, month };
    });
  }

  function openNewForm(prefillDate?: string) {
    setEditingSession(null);
    setFormDate(prefillDate ?? dayModal ?? today);
    setStartTime("07:00");
    setEndTime("08:00");
    setTitle("");
    setSelectedClientIds([]);
    setClientSearch("");
    setFormOpen(true);
  }

  function openEditForm(session: ClassSession) {
    setEditingSession(session);
    setFormDate(session.date);
    setStartTime(session.start_time);
    setEndTime(session.end_time);
    setTitle(session.title ?? "");
    setSelectedClientIds(session.clients.map((c) => c.id));
    setClientSearch("");
    setFormOpen(true);
  }

  function toggleClient(id: string) {
    setSelectedClientIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedClientIds.length === 0) return;
    await saveClassSession({
      id: editingSession?.id,
      date: formDate,
      start_time: startTime,
      end_time: endTime,
      title: title || null,
      client_ids: selectedClientIds,
    });
    setFormOpen(false);
    await refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta clase agendada?")) return;
    await deleteClassSession(id);
    await refresh();
  }

  const filteredClientsForForm = clients.filter((c) =>
    c.full_name.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const monthLabel = `${MONTH_NAMES[cursor.month]} ${cursor.year}`;
  const daySessions = dayModal
    ? [...(sessionsByDate.get(dayModal) ?? [])].sort((a, b) => (a.start_time < b.start_time ? -1 : 1))
    : [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Calendario</h1>
          <p className="text-sm text-zinc-500">Agenda las clases de tus clientes</p>
        </div>
        <button onClick={() => openNewForm(today)} className="btn-primary">
          <Plus size={16} /> Agendar clase
        </button>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-3 shadow-sm">
        <button onClick={() => goToMonth(-1)} className="rounded-lg p-1.5 hover:bg-zinc-100" aria-label="Mes anterior">
          <ChevronLeft size={18} />
        </button>
        <p className="font-semibold capitalize text-zinc-900">{monthLabel}</p>
        <button onClick={() => goToMonth(1)} className="rounded-lg p-1.5 hover:bg-zinc-100" aria-label="Mes siguiente">
          <ChevronRight size={18} />
        </button>
      </div>

      {loading ? (
        <div className="h-96 animate-pulse rounded-xl bg-zinc-100" />
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white p-3 shadow-sm">
          <div className="grid grid-cols-7 gap-1 text-center">
            {WEEKDAYS.map((w) => (
              <span key={w} className="pb-2 text-xs font-semibold text-zinc-400">
                {w}
              </span>
            ))}
            {monthMatrix(cursor.year, cursor.month).flatMap((week, wi) =>
              week.map((day, di) => {
                if (!day) return <div key={`${wi}-${di}`} />;
                const iso = toISODate(day);
                const count = sessionsByDate.get(iso)?.length ?? 0;
                const isToday = iso === today;
                return (
                  <button
                    key={`${wi}-${di}`}
                    onClick={() => setDayModal(iso)}
                    className={`flex aspect-square flex-col items-center justify-center gap-0.5 rounded-lg text-sm transition-colors ${
                      isToday ? "bg-violet-50 font-semibold text-violet-700" : "text-zinc-700 hover:bg-zinc-50"
                    }`}
                  >
                    {day.getDate()}
                    {count > 0 && (
                      <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-violet-600 px-1 text-[10px] font-semibold text-white">
                        {count}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {dayModal && (
        <Modal title={formatDate(dayModal)} onClose={() => setDayModal(null)}>
          <div className="flex flex-col gap-3">
            {daySessions.length === 0 ? (
              <EmptyState icon={CalendarDays} title="Sin clases agendadas este dia" />
            ) : (
              <ul className="flex flex-col gap-2">
                {daySessions.map((session) => (
                  <li key={session.id} className="rounded-lg border border-zinc-200 p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-zinc-900">
                          {session.start_time} - {session.end_time}
                        </p>
                        {session.title && <p className="text-xs text-zinc-500">{session.title}</p>}
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEditForm(session)}
                          className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100"
                          aria-label="Editar clase"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(session.id)}
                          className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                          aria-label="Eliminar clase"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {session.clients.map((c) => (
                        <span
                          key={c.id}
                          className="flex items-center gap-1.5 rounded-full bg-zinc-100 py-0.5 pl-0.5 pr-2 text-xs text-zinc-700"
                        >
                          <Avatar name={c.full_name} size={20} />
                          {c.full_name}
                        </span>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <button onClick={() => openNewForm(dayModal)} className="btn-primary justify-center">
              <Plus size={16} /> Agendar clase este dia
            </button>
          </div>
        </Modal>
      )}

      {formOpen && (
        <Modal title={editingSession ? "Editar clase" : "Agendar clase"} onClose={() => setFormOpen(false)}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="grid grid-cols-3 gap-3">
              <Field label="Fecha">
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="input"
                />
              </Field>
              <Field label="Inicio">
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="input"
                />
              </Field>
              <Field label="Fin">
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="input"
                />
              </Field>
            </div>
            <Field label="Titulo (opcional)">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Clase grupal de fuerza"
                className="input"
              />
            </Field>
            <div className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-zinc-700">
                Clientes * ({selectedClientIds.length} seleccionados)
              </span>
              <input
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                placeholder="Buscar cliente..."
                className="input"
              />
              <div className="mt-1 max-h-48 overflow-y-auto rounded-lg border border-zinc-200">
                {filteredClientsForForm.length === 0 ? (
                  <p className="p-3 text-sm text-zinc-500">No hay clientes activos que coincidan.</p>
                ) : (
                  filteredClientsForForm.map((c) => (
                    <label
                      key={c.id}
                      className="flex items-center gap-2 border-b border-zinc-100 p-2 text-sm last:border-b-0 hover:bg-zinc-50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedClientIds.includes(c.id)}
                        onChange={() => toggleClient(c.id)}
                        className="h-4 w-4 rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
                      />
                      <Avatar name={c.full_name} size={24} />
                      {c.full_name}
                    </label>
                  ))
                )}
              </div>
            </div>
            <button
              type="submit"
              disabled={selectedClientIds.length === 0}
              className="btn-primary mt-2 justify-center"
            >
              Guardar clase
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-zinc-700">{label}</span>
      {children}
    </label>
  );
}
