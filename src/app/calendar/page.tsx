"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import Modal from "@/components/Modal";
import Avatar from "@/components/Avatar";
import { MONTH_NAMES, WEEKDAYS_SHORT, addDays, startOfWeek, toISODate } from "@/lib/calendar-utils";
import {
  deleteClassSession,
  listClassSessions,
  listClients,
  saveClassSession,
} from "@/lib/data-service";
import { todayISO } from "@/lib/format";
import { Client, ClassSession } from "@/lib/types";

const HOUR_START = 5;
const HOUR_END = 21;
const HOUR_HEIGHT = 56;

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function formatHourLabel(hour: number): string {
  const period = hour < 12 ? "AM" : "PM";
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12} ${period}`;
}

function formatShortDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return `${d.getDate()} de ${MONTH_NAMES[d.getMonth()].toLowerCase()}`;
}

interface LaidOutSession extends ClassSession {
  col: number;
  colCount: number;
}

function layoutDaySessions(sessions: ClassSession[]): LaidOutSession[] {
  const sorted = [...sessions].sort((a, b) => (a.start_time < b.start_time ? -1 : 1));
  const columnEnds: string[] = [];
  const placed: (ClassSession & { col: number })[] = [];
  for (const s of sorted) {
    let col = columnEnds.findIndex((end) => end <= s.start_time);
    if (col === -1) {
      col = columnEnds.length;
      columnEnds.push(s.end_time);
    } else {
      columnEnds[col] = s.end_time;
    }
    placed.push({ ...s, col });
  }
  const colCount = columnEnds.length || 1;
  return placed.map((p) => ({ ...p, colCount }));
}

export default function CalendarPage() {
  const today = todayISO();
  const [weekStart, setWeekStart] = useState(() => toISODate(startOfWeek(today)));
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
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

  const weekDays = useMemo(() => {
    const start = new Date(`${weekStart}T00:00:00`);
    return Array.from({ length: 7 }, (_, i) => toISODate(addDays(start, i)));
  }, [weekStart]);

  const sessionsByDate = useMemo(() => {
    const map = new Map<string, ClassSession[]>();
    for (const s of sessions) {
      const arr = map.get(s.date) ?? [];
      arr.push(s);
      map.set(s.date, arr);
    }
    return map;
  }, [sessions]);

  const hours = useMemo(
    () => Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i),
    []
  );

  function goToWeek(deltaWeeks: number) {
    setWeekStart((prev) => toISODate(addDays(new Date(`${prev}T00:00:00`), deltaWeeks * 7)));
  }

  function goToToday() {
    setWeekStart(toISODate(startOfWeek(today)));
  }

  function openNewForm(dateIso: string, start = "07:00", end = "08:00") {
    setEditingSession(null);
    setFormDate(dateIso);
    setStartTime(start);
    setEndTime(end);
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

  async function handleDelete() {
    if (!editingSession) return;
    if (!confirm("¿Eliminar esta clase agendada?")) return;
    await deleteClassSession(editingSession.id);
    setFormOpen(false);
    await refresh();
  }

  const filteredClientsForForm = clients.filter((c) =>
    c.full_name.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const rangeLabel = `${formatShortDate(weekDays[0])} — ${formatShortDate(weekDays[6])} ${new Date(
    `${weekDays[6]}T00:00:00`
  ).getFullYear()}`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Agenda</h1>
          <p className="text-sm text-zinc-500">{rangeLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => openNewForm(today)} className="btn-primary">
            <Plus size={16} /> Agendar clase
          </button>
          <button onClick={() => goToWeek(-1)} className="rounded-lg border border-zinc-200 bg-white p-2 hover:bg-zinc-50" aria-label="Semana anterior">
            <ChevronLeft size={16} />
          </button>
          <button onClick={goToToday} className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
            Hoy
          </button>
          <button onClick={() => goToWeek(1)} className="rounded-lg border border-zinc-200 bg-white p-2 hover:bg-zinc-50" aria-label="Semana siguiente">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-96 animate-pulse rounded-xl bg-zinc-100" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
          <div style={{ minWidth: 780 }}>
            <div
              className="sticky top-0 z-10 grid border-b border-zinc-200 bg-white"
              style={{ gridTemplateColumns: "56px repeat(7, minmax(100px, 1fr))" }}
            >
              <div />
              {weekDays.map((iso, i) => {
                const isToday = iso === today;
                const count = sessionsByDate.get(iso)?.length ?? 0;
                const d = new Date(`${iso}T00:00:00`);
                return (
                  <div key={iso} className="border-l border-zinc-100 px-1 py-2 text-center">
                    <p className="text-[10px] font-semibold tracking-wide text-zinc-400">
                      {WEEKDAYS_SHORT[i]}
                    </p>
                    <p
                      className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${
                        isToday ? "bg-violet-600 text-white" : "text-zinc-800"
                      }`}
                    >
                      {d.getDate()}
                    </p>
                    <p className="text-[10px] text-zinc-400">{count > 0 ? `${count} clase${count > 1 ? "s" : ""}` : ""}</p>
                  </div>
                );
              })}
            </div>

            <div className="relative grid" style={{ gridTemplateColumns: "56px repeat(7, minmax(100px, 1fr))" }}>
              <div className="relative">
                {hours.map((h) => (
                  <div
                    key={h}
                    style={{ height: HOUR_HEIGHT }}
                    className="border-t border-zinc-100 pr-1.5 text-right text-[10px] text-zinc-400"
                  >
                    <span className="relative -top-1.5">{formatHourLabel(h)}</span>
                  </div>
                ))}
              </div>

              {weekDays.map((iso) => {
                const laidOut = layoutDaySessions(sessionsByDate.get(iso) ?? []);
                return (
                  <div key={iso} className="relative border-l border-zinc-100">
                    {hours.map((h) => (
                      <div key={h} style={{ height: HOUR_HEIGHT }} className="group relative border-t border-zinc-100">
                        <button
                          onClick={() => openNewForm(iso, `${pad(h)}:00`, `${pad(h + 1)}:00`)}
                          className="absolute inset-x-0 top-0 flex h-1/2 items-center justify-center text-[9px] text-violet-500 opacity-0 hover:bg-violet-50 group-hover:opacity-100"
                        >
                          clic para agregar
                        </button>
                        <button
                          onClick={() => openNewForm(iso, `${pad(h)}:30`, `${pad(h + 1)}:30`)}
                          className="absolute inset-x-0 top-1/2 flex h-1/2 items-center justify-center text-[9px] text-violet-500 opacity-0 hover:bg-violet-50 group-hover:opacity-100"
                        >
                          clic para agregar
                        </button>
                      </div>
                    ))}

                    {laidOut.map((session) => {
                      const startMin = Math.max(timeToMinutes(session.start_time), HOUR_START * 60);
                      const endMin = Math.min(timeToMinutes(session.end_time), HOUR_END * 60);
                      const top = ((startMin - HOUR_START * 60) / 60) * HOUR_HEIGHT;
                      const height = Math.max(((endMin - startMin) / 60) * HOUR_HEIGHT, 20);
                      const widthPct = 100 / session.colCount;
                      return (
                        <button
                          key={session.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditForm(session);
                          }}
                          style={{
                            top,
                            height,
                            left: `${session.col * widthPct}%`,
                            width: `${widthPct}%`,
                          }}
                          className="absolute z-[1] overflow-hidden rounded-md border border-violet-300 bg-violet-100 p-1 text-left shadow-sm hover:bg-violet-200"
                        >
                          <p className="truncate text-[11px] font-semibold text-violet-900">
                            {session.title || `${session.clients.length} cliente(s)`}
                          </p>
                          <p className="truncate text-[10px] text-violet-700">
                            {session.start_time} - {session.end_time}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
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
              <div className="mt-1 max-h-40 overflow-y-auto rounded-lg border border-zinc-200">
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
            <div className="mt-2 flex items-center gap-2">
              <button
                type="submit"
                disabled={selectedClientIds.length === 0}
                className="btn-primary flex-1 justify-center"
              >
                Guardar clase
              </button>
              {editingSession && (
                <button type="button" onClick={handleDelete} className="btn-danger">
                  <Trash2 size={14} /> Eliminar
                </button>
              )}
            </div>
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
