"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Trash2, X } from "lucide-react";
import Modal from "@/components/Modal";
import Avatar from "@/components/Avatar";
import { MONTH_NAMES, WEEKDAYS, WEEKDAYS_FULL, addDays, toISODate } from "@/lib/calendar-utils";
import {
  createRecurringClassSessions,
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

function formatDayLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  const weekday = WEEKDAYS_FULL[(d.getDay() + 6) % 7];
  return `${weekday}, ${d.getDate()} de ${MONTH_NAMES[d.getMonth()].toLowerCase()} de ${d.getFullYear()}`;
}

function generateRecurringDates(startDate: string, untilDate: string, weekdays: Set<number>): string[] {
  const dates: string[] = [];
  let d = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${untilDate}T00:00:00`);
  while (d <= end) {
    const wd = (d.getDay() + 6) % 7;
    if (weekdays.has(wd)) dates.push(toISODate(d));
    d = addDays(d, 1);
  }
  return dates;
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
  const [currentDate, setCurrentDate] = useState(today);
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
  const [guestNames, setGuestNames] = useState<string[]>([]);
  const [guestInput, setGuestInput] = useState("");
  const [repeatEnabled, setRepeatEnabled] = useState(false);
  const [repeatDays, setRepeatDays] = useState<Set<number>>(new Set());
  const [repeatUntil, setRepeatUntil] = useState("");

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

  const hours = useMemo(
    () => Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i),
    []
  );

  function goToDay(deltaDays: number) {
    setCurrentDate((prev) => toISODate(addDays(new Date(`${prev}T00:00:00`), deltaDays)));
  }

  function goToToday() {
    setCurrentDate(today);
  }

  const touchStart = useRef<{ x: number; y: number } | null>(null);

  function handleTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (!touchStart.current) return;
    const t = e.changedTouches[0];
    const deltaX = t.clientX - touchStart.current.x;
    const deltaY = t.clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(deltaX) > 60 && Math.abs(deltaX) > Math.abs(deltaY)) {
      goToDay(deltaX < 0 ? 1 : -1);
    }
  }

  function openNewForm(dateIso: string, start = "07:00", end = "08:00") {
    setEditingSession(null);
    setFormDate(dateIso);
    setStartTime(start);
    setEndTime(end);
    setTitle("");
    setSelectedClientIds([]);
    setClientSearch("");
    setGuestNames([]);
    setGuestInput("");
    setRepeatEnabled(false);
    setRepeatDays(new Set());
    setRepeatUntil("");
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
    setGuestNames(session.guests);
    setGuestInput("");
    setRepeatEnabled(false);
    setRepeatDays(new Set());
    setRepeatUntil("");
    setFormOpen(true);
  }

  function toggleClient(id: string) {
    setSelectedClientIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  }

  function addGuest() {
    const name = guestInput.trim();
    if (!name) return;
    setGuestNames((names) => [...names, name]);
    setGuestInput("");
  }

  function removeGuest(index: number) {
    setGuestNames((names) => names.filter((_, i) => i !== index));
  }

  function toggleRepeatDay(day: number) {
    setRepeatDays((days) => {
      const next = new Set(days);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const pendingGuest = guestInput.trim();
    const finalGuestNames =
      pendingGuest && !guestNames.includes(pendingGuest) ? [...guestNames, pendingGuest] : guestNames;
    if (selectedClientIds.length === 0 && finalGuestNames.length === 0) return;
    const payload = {
      id: editingSession?.id,
      date: formDate,
      start_time: startTime,
      end_time: endTime,
      title: title || null,
      client_ids: selectedClientIds,
      guest_names: finalGuestNames,
    };
    if (!editingSession && repeatEnabled && repeatDays.size > 0 && repeatUntil) {
      const dates = generateRecurringDates(formDate, repeatUntil, repeatDays);
      await createRecurringClassSessions(payload, dates);
    } else {
      await saveClassSession(payload);
    }
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

  const isToday = currentDate === today;
  const dayLabel = formatDayLabel(currentDate);
  const daySessions = layoutDaySessions(sessionsByDate.get(currentDate) ?? []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold capitalize text-zinc-50">{dayLabel}</h1>
          <p className="text-sm text-zinc-400">
            {isToday ? "Hoy" : ""} {daySessions.length > 0 ? `· ${daySessions.length} clase${daySessions.length > 1 ? "s" : ""}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => openNewForm(currentDate)} className="btn-primary">
            <Plus size={16} /> Agendar clase
          </button>
          <button onClick={() => goToDay(-1)} className="rounded-lg border border-zinc-800 bg-zinc-900 p-2 hover:bg-zinc-950" aria-label="Dia anterior">
            <ChevronLeft size={16} />
          </button>
          <button onClick={goToToday} className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-950">
            Hoy
          </button>
          <button onClick={() => goToDay(1)} className="rounded-lg border border-zinc-800 bg-zinc-900 p-2 hover:bg-zinc-950" aria-label="Dia siguiente">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <p className="text-xs text-zinc-600 sm:hidden">Desliza hacia un lado para cambiar de dia</p>

      {loading ? (
        <div className="h-96 animate-pulse rounded-xl bg-zinc-800" />
      ) : (
        <div
          className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-sm"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="relative grid" style={{ gridTemplateColumns: "56px 1fr" }}>
            <div className="relative">
              {hours.map((h) => (
                <div
                  key={h}
                  style={{ height: HOUR_HEIGHT }}
                  className="border-t border-zinc-800 pr-1.5 text-right text-[10px] text-zinc-600"
                >
                  <span className="relative -top-1.5">{formatHourLabel(h)}</span>
                </div>
              ))}
            </div>

            <div className="relative border-l border-zinc-800">
              {hours.map((h) => (
                <div key={h} style={{ height: HOUR_HEIGHT }} className="group relative border-t border-zinc-800">
                  <button
                    onClick={() => openNewForm(currentDate, `${pad(h)}:00`, `${pad(h + 1)}:00`)}
                    className="absolute inset-x-0 top-0 flex h-1/2 items-center justify-center text-[10px] text-violet-400 opacity-0 hover:bg-violet-500/10 sm:group-hover:opacity-100"
                  >
                    clic para agregar
                  </button>
                  <button
                    onClick={() => openNewForm(currentDate, `${pad(h)}:30`, `${pad(h + 1)}:30`)}
                    className="absolute inset-x-0 top-1/2 flex h-1/2 items-center justify-center text-[10px] text-violet-400 opacity-0 hover:bg-violet-500/10 sm:group-hover:opacity-100"
                  >
                    clic para agregar
                  </button>
                </div>
              ))}

              {daySessions.map((session) => {
                const startMin = Math.max(timeToMinutes(session.start_time), HOUR_START * 60);
                const endMin = Math.min(timeToMinutes(session.end_time), HOUR_END * 60);
                const top = ((startMin - HOUR_START * 60) / 60) * HOUR_HEIGHT;
                const height = Math.max(((endMin - startMin) / 60) * HOUR_HEIGHT, 26);
                const widthPct = 100 / session.colCount;
                const attendeeNames = [
                  ...session.clients.map((c) => c.full_name),
                  ...session.guests.map((g) => `${g} (cortesia)`),
                ];
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
                    className="absolute z-[1] overflow-hidden rounded-md border border-violet-500/40 bg-violet-500/15 p-1.5 text-left shadow-sm hover:bg-violet-500/20"
                  >
                    <p className="truncate text-xs font-semibold text-violet-200">
                      {session.title || `${attendeeNames.length} cliente(s)`}
                    </p>
                    <p className="truncate text-[11px] text-violet-300">
                      {session.start_time} - {session.end_time}
                    </p>
                    {attendeeNames.length > 0 && (
                      <p className="truncate text-[10px] text-violet-400">{attendeeNames.join(", ")}</p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {formOpen && (
        <Modal title={editingSession ? "Editar clase" : "Agendar clase"} onClose={() => setFormOpen(false)}>
          <form onSubmit={handleSubmit} onKeyDown={preventEnterSubmit} className="flex flex-col gap-3">
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
              <span className="font-medium text-zinc-300">
                Clientes ({selectedClientIds.length} seleccionados)
              </span>
              <input
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                placeholder="Buscar cliente..."
                className="input"
              />
              <div className="mt-1 max-h-40 overflow-y-auto rounded-lg border border-zinc-800">
                {filteredClientsForForm.length === 0 ? (
                  <p className="p-3 text-sm text-zinc-400">No hay clientes activos que coincidan.</p>
                ) : (
                  filteredClientsForForm.map((c) => (
                    <label
                      key={c.id}
                      className="flex items-center gap-2 border-b border-zinc-800 p-2 text-sm last:border-b-0 hover:bg-zinc-950"
                    >
                      <input
                        type="checkbox"
                        checked={selectedClientIds.includes(c.id)}
                        onChange={() => toggleClient(c.id)}
                        className="h-4 w-4 rounded border-zinc-700 text-violet-400 focus:ring-violet-500"
                      />
                      <Avatar name={c.full_name} size={24} />
                      {c.full_name}
                    </label>
                  ))
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-zinc-300">Cortesias / invitados sin cliente</span>
              <div className="flex gap-2">
                <input
                  value={guestInput}
                  onChange={(e) => setGuestInput(e.target.value)}
                  placeholder="Nombre del invitado"
                  className="input"
                />
                <button type="button" onClick={addGuest} className="btn-secondary shrink-0">
                  Agregar
                </button>
              </div>
              {guestNames.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-2">
                  {guestNames.map((name, i) => (
                    <span
                      key={i}
                      className="flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs text-amber-300"
                    >
                      {name}
                      <button type="button" onClick={() => removeGuest(i)} aria-label="Quitar invitado">
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {!editingSession && (
              <div className="flex flex-col gap-2 rounded-lg border border-zinc-800 p-3">
                <label className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                  <input
                    type="checkbox"
                    checked={repeatEnabled}
                    onChange={(e) => setRepeatEnabled(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-700 text-violet-400 focus:ring-violet-500"
                  />
                  Repetir semanalmente
                </label>
                {repeatEnabled && (
                  <>
                    <div className="flex gap-1.5">
                      {WEEKDAYS.map((label, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => toggleRepeatDay(i)}
                          className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                            repeatDays.has(i) ? "bg-violet-600 text-white" : "bg-zinc-800 text-zinc-400"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <Field label="Repetir hasta">
                      <input
                        type="date"
                        required={repeatEnabled}
                        min={formDate}
                        value={repeatUntil}
                        onChange={(e) => setRepeatUntil(e.target.value)}
                        className="input"
                      />
                    </Field>
                  </>
                )}
              </div>
            )}

            <div className="mt-2 flex items-center gap-2">
              <button
                type="submit"
                disabled={
                  selectedClientIds.length === 0 && guestNames.length === 0 && guestInput.trim() === ""
                }
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

function preventEnterSubmit(e: React.KeyboardEvent<HTMLFormElement>) {
  if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA") {
    e.preventDefault();
  }
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-zinc-300">{label}</span>
      {children}
    </label>
  );
}
