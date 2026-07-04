"use client";

import Modal from "@/components/Modal";
import { formatDate, todayISO } from "@/lib/format";
import { Client, Payment, Plan } from "@/lib/types";

const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"];
const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toISODate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function monthMatrix(year: number, month: number): (Date | null)[][] {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = (firstDay.getDay() + 6) % 7; // Monday = 0

  const weeks: (Date | null)[][] = [];
  let week: (Date | null)[] = new Array(startWeekday).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    week.push(new Date(year, month, d));
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }
  return weeks;
}

function monthsBetween(startISO: string, endISO: string): { year: number; month: number }[] {
  const start = new Date(`${startISO}T00:00:00`);
  const end = new Date(`${endISO}T00:00:00`);
  const months: { year: number; month: number }[] = [];
  let y = start.getFullYear();
  let m = start.getMonth();
  while (y < end.getFullYear() || (y === end.getFullYear() && m <= end.getMonth())) {
    months.push({ year: y, month: m });
    m++;
    if (m > 11) {
      m = 0;
      y++;
    }
  }
  return months;
}

export default function ClientCalendarModal({
  client,
  period,
  plan,
  attendedDates,
  onClose,
}: {
  client: Client;
  period: Payment | null;
  plan: Plan | null;
  attendedDates: Set<string>;
  onClose: () => void;
}) {
  const today = todayISO();
  const target = plan?.sessions_per_period ?? null;
  const used = period
    ? [...attendedDates].filter((d) => d >= period.period_start && d <= period.period_end).length
    : 0;

  return (
    <Modal title={`Asistencia de ${client.full_name}`} onClose={onClose}>
      {!period ? (
        <p className="text-sm text-zinc-500">
          Este cliente todavia no tiene ningun pago registrado, asi que no hay un periodo de plan
          para mostrar en el calendario.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="rounded-lg bg-violet-50 p-3">
            <p className="text-sm font-medium text-violet-900">
              Periodo: {formatDate(period.period_start)} - {formatDate(period.period_end)}
            </p>
            {target && (
              <div className="mt-2 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white">
                  <div
                    className={`h-full rounded-full ${used >= target ? "bg-emerald-500" : "bg-violet-500"}`}
                    style={{ width: `${Math.min(100, Math.round((used / target) * 100))}%` }}
                  />
                </div>
                <span className="shrink-0 text-xs font-medium text-violet-800">
                  {used} de {target} sesiones
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            {monthsBetween(period.period_start, period.period_end).map(({ year, month }) => (
              <div key={`${year}-${month}`}>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  {MONTH_NAMES[month]} {year}
                </p>
                <div className="grid grid-cols-7 gap-1 text-center">
                  {WEEKDAYS.map((w) => (
                    <span key={w} className="text-[10px] font-medium text-zinc-400">
                      {w}
                    </span>
                  ))}
                  {monthMatrix(year, month).flatMap((week, wi) =>
                    week.map((day, di) => {
                      if (!day) return <span key={`${wi}-${di}`} />;
                      const iso = toISODate(day);
                      const inPeriod = iso >= period.period_start && iso <= period.period_end;
                      const attended = attendedDates.has(iso);
                      const isFuture = iso > today;

                      let cellClass = "text-zinc-300";
                      if (inPeriod && attended) {
                        cellClass = "bg-emerald-500 text-white font-semibold";
                      } else if (inPeriod && !isFuture) {
                        cellClass = "border border-zinc-200 text-zinc-600";
                      } else if (inPeriod && isFuture) {
                        cellClass = "border border-dashed border-zinc-200 text-zinc-400";
                      }

                      return (
                        <span
                          key={`${wi}-${di}`}
                          className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${cellClass}`}
                        >
                          {day.getDate()}
                        </span>
                      );
                    })
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4 text-xs text-zinc-500">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-emerald-500" /> Asistio
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full border border-zinc-300" /> No asistio
            </span>
          </div>
        </div>
      )}
    </Modal>
  );
}
