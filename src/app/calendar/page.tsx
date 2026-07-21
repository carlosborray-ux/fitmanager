"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Trash2, X } from "lucide-react";
import Modal from "@/components/Modal";
import Avatar from "@/components/Avatar";
import { MONTH_NAMES, WEEKDAYS, WEEKDAYS_FULL, addDays, monthMatrix, toISODate } from "@/lib/calendar-utils";
import {
  createRecurringClassSessions,
  deleteClassSession,
  deleteClassSessionSeries,
  listClassSessions,
  listClients,
  saveClassSession,
  updateClassSessionSeries,
} from "@/lib/data-service";
import { todayISO } from "@/lib/format";
import { Client, ClassSession } from "@/lib/types";

const HOUR_START = 5;
const HOUR_END = 23;
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

function formatSelectedDayLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  const weekday = WEEKDAYS_FULL[(d.getDay() + 6) % 7];
  return `${weekday} ${d.getDate()} de ${MONTH_NAMES[d.getMonth()].toLowerCase()}`;
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

export default function CalendarPage() {
  const today = todayISO();
  const [viewDate, setViewDate] = useState(today);
  const [selectedDate, setSelectedDate] = useState(today);
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
  const [applyScope, setApplyScope] = useState<"one" | "future">("one");
  const [saving, setSaving] = useState(false);

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

  const viewD = new Date(`${viewDate}T00:00:00`);
  const year = viewD.getFullYear();
  const month = viewD.getMonth();
  const weeks = useMemo(() => monthMatrix(year, month), [year, month]);
  const monthLabel = `${MONTH_NAMES[month]} ${year}`;

  function goToMonth(delta: number) {
    setViewDate((prev) => {
      const d = new Date(`${prev}T00:00:00`);
      d.setMonth(d.getMonth() + delta);
      return toISODate(d);
    });
  }

  function goToToday() {
    setViewDate(today);
    setSelectedDate(today);
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
      goToMonth(deltaX < 0 ? 1 : -1);
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
    setApplyScope("one");
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
    setApplyScope("one");
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

    setSaving(true);
    try {
      if (!editingSession && repeatEnabled && repeatDays.size > 0 && repeatUntil) {
        const dates = generateRecurringDates(formDate, repeatUntil, repeatDays);
        await createRecurringClassSessions(
          {
            start_time: startTime,
            end_time: endTime,
            title: title || null,
            client_ids: selectedClientIds,
            guest_names: finalGuestNames,
          },
          dates
        );
      } else if (editingSession?.series_id && applyScope === "future") {
        await updateClassSessionSeries(editingSession.series_id, editingSession.date, {
          start_time: startTime,
          end_time: endTime,
          title: title || null,
          client_ids: selectedClientIds,
          guest_names: finalGuestNames,
        });
      } else {
        await saveClassSession({
          id: editingSession?.id,
          date: formDate,
          start_time: startTime,
          end_time: endTime,
          title: title || null,
          client_ids: selectedClientIds,
          guest_names: finalGuestNames,
        });
      }
      setFormOpen(false);
      await refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(scope: "one" | "future") {
    if (!editingSession) return;
    const message =
      scope === "future"
        ? "¿Eliminar esta clase y todas las futuras de esta serie?"
        : "¿Eliminar esta clase agendada?";
    if (!confirm(message)) return;
    if (scope === "future" && editingSession.series_id) {
      await deleteClassSessionSeries(editingSession.series_id, editingSession.date);
    } else {
      await deleteClassSession(editingSession.id);
    }
    setFormOpen(false);
    await refresh();
  }

  const filteredClientsForForm = clients.filter((c) =>
    c.full_name.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const selectedDaySessions = useMemo(
    () => layoutDaySessions(sessionsByDate.get(selectedDate) ?? []),
    [sessionsByDate, selectedDate]
  );

  const dayHours = useMemo(
    () => Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i),
    []
  );

  const dayTouchStart = useRef<{ x: number; y: number } | null>(null);

  function handleDayTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    dayTouchStart.current = { x: t.clientX, y: t.clientY };
  }

  function handleDayTouchEnd(e: React.TouchEvent) {
    if (!dayTouchStart.current) return;
    const t = e.changedTouches[0];
    const deltaX = t.clientX - dayTouchStart.current.x;
    const deltaY = t.clientY - dayTouchStart.current.y;
    dayTouchStart.current = null;
    if (Math.abs(deltaX) > 60 && Math.abs(deltaX) > Math.abs(deltaY)) {
      setSelectedDate((prev) => toISODate(addDays(new Date(`${prev}T00:00:00`), deltaX < 0 ? 1 : -1)));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-2xl font-bold text-transparent">
          Calendario
        </h1>
        <button
          onClick={goToToday}
          className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm font-medium text-zinc-300 hover:border-zinc-600 hover:bg-zinc-700"
        >
          Hoy
        </button>
      </div>

      <div className="card p-3">
        <div className="mb-2 flex items-center justify-between">
          <button
            onClick={() => goToMonth(-1)}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-50"
            aria-label="Mes anterior"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-base font-semibold capitalize text-zinc-50">{monthLabel}</span>
          <button
            onClick={() => goToMonth(1)}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-50"
            aria-label="Mes siguiente"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div
          className="grid grid-cols-7 gap-y-1"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {WEEKDAYS.map((w, i) => (
            <div key={i} className="pb-1 text-center text-[11px] font-semibold uppercase text-zinc-500">
              {w}
            </div>
          ))}

          {weeks.flatMap((week, wi) =>
            week.map((day, di) => {
              if (!day) return <div key={`${wi}-${di}`} />;
              const iso = toISODate(day);
              const isToday = iso === today;
              const isSelected = iso === selectedDate;
              const count = sessionsByDate.get(iso)?.length ?? 0;
              return (
                <button
                  key={`${wi}-${di}`}
                  onClick={() => setSelectedDate(iso)}
                  className="flex flex-col items-center gap-1 py-1"
                >
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                      isSelected
                        ? "bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white"
                        : isToday
                          ? "border border-violet-500 text-violet-300"
                          : "text-zinc-300 hover:bg-zinc-800"
                    }`}
                  >
                    {day.getDate()}
                  </span>
                  <span className="flex h-1.5 items-center gap-0.5">
                    {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                      <span
                        key={i}
                        className={`h-1 w-1 rounded-full ${isSelected ? "bg-violet-300" : "bg-violet-500"}`}
                      />
                    ))}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold capitalize text-zinc-50">{formatSelectedDayLabel(selectedDate)}</h2>
        <button onClick={() => openNewForm(selectedDate)} className="btn-primary px-3 py-1.5 text-xs">
          <Plus size={14} /> Agendar
        </button>
      </div>

      {loading ? (
        <div className="h-24 animate-pulse rounded-xl bg-zinc-800" />
      ) : (
        <div
          className="card relative overflow-hidden"
          onTouchStart={handleDayTouchStart}
          onTouchEnd={handleDayTouchEnd}
        >
          <div className="relative grid" style={{ gridTemplateColumns: "48px 1fr" }}>
            <div className="relative">
              {dayHours.map((h) => (
                <div
                  key={h}
                  style={{ height: HOUR_HEIGHT }}
                  className="border-t border-zinc-800 pr-1.5 pt-2 text-right text-[10px] text-zinc-600"
                >
                  <span className="relative -top-1.5">{formatHourLabel(h)}</span>
                </div>
              ))}
            </div>

            <div className="relative border-l border-zinc-800">
              {dayHours.map((h) => (
                <div key={h} style={{ height: HOUR_HEIGHT }} className="group relative border-t border-zinc-800">
                  <button
                    onClick={() => openNewForm(selectedDate, `${pad(h)}:00`, `${pad(h + 1)}:00`)}
                    className="absolute inset-x-0 top-0 flex h-1/2 items-center justify-center text-[10px] text-violet-400 opacity-0 hover:bg-violet-500/10 sm:group-hover:opacity-100"
                  >
                    clic para agregar
                  </button>
                  <button
                    onClick={() => openNewForm(selectedDate, `${pad(h)}:30`, `${pad(h + 1)}:30`)}
                    className="absolute inset-x-0 top-1/2 flex h-1/2 items-center justify-center text-[10px] text-violet-400 opacity-0 hover:bg-violet-500/10 sm:group-hover:opacity-100"
                  >
                    clic para agregar
                  </button>
                </div>
              ))}

              {selectedDaySessions.map((session) => {
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
                    className="absolute z-[1] overflow-hidden rounded-md border border-violet-400/50 bg-gradient-to-br from-violet-500/30 to-fuchsia-500/20 p-1.5 text-left shadow-sm hover:from-violet-500/40 hover:to-fuchsia-500/30"
                  >
                    <p className="truncate text-xs font-semibold text-violet-100">
                      {session.title || `${attendeeNames.length} cliente(s)`}
                    </p>
                    <p className="truncate text-[11px] text-violet-200">
                      {session.start_time} - {session.end_time}
                    </p>
                    {attendeeNames.length > 0 && (
                      <p className="truncate text-[10px] text-violet-300">{attendeeNames.join(", ")}</p>
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
                      className="flex items-center gap-2 border-b border-zinc-800 p-2 text-sm last:border-b-0 hover:bg-zinc-800"
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
                      className="flex items-center gap-1.5 rounded-full bg-amber-500/25 px-2.5 py-1 text-xs text-amber-300"
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
                            repeatDays.has(i) ? "bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white" : "bg-zinc-800 text-zinc-400"
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

            {editingSession?.series_id && (
              <div className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-zinc-300">Aplicar cambios a</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setApplyScope("one")}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                      applyScope === "one"
                        ? "border-transparent bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white"
                        : "border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                    }`}
                  >
                    Solo esta clase
                  </button>
                  <button
                    type="button"
                    onClick={() => setApplyScope("future")}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                      applyScope === "future"
                        ? "border-transparent bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white"
                        : "border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                    }`}
                  >
                    Esta y las futuras
                  </button>
                </div>
              </div>
            )}

            <div className="mt-2 flex items-center gap-2">
              <button
                type="submit"
                disabled={
                  saving ||
                  (selectedClientIds.length === 0 && guestNames.length === 0 && guestInput.trim() === "")
                }
                className="btn-primary flex-1 justify-center"
              >
                {saving ? "Guardando..." : "Guardar clase"}
              </button>
              {editingSession && !editingSession.series_id && (
                <button type="button" onClick={() => handleDelete("one")} className="btn-danger">
                  <Trash2 size={14} /> Eliminar
                </button>
              )}
            </div>
            {editingSession?.series_id && (
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => handleDelete("one")} className="btn-danger flex-1 justify-center">
                  <Trash2 size={14} /> Eliminar solo esta
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete("future")}
                  className="btn-danger flex-1 justify-center"
                >
                  <Trash2 size={14} /> Eliminar esta y futuras
                </button>
              </div>
            )}
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
