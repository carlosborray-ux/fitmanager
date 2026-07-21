"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarCheck,
  Dumbbell,
  Pencil,
  Plus,
  Trash2,
  Wallet,
} from "lucide-react";
import Avatar from "@/components/Avatar";
import Modal from "@/components/Modal";
import StatusBadge from "@/components/StatusBadge";
import StatCard from "@/components/StatCard";
import EmptyState from "@/components/EmptyState";
import {
  createTrainingLog,
  deleteTrainingLog,
  findLatestPeriod,
  listAttendance,
  listClients,
  listPayments,
  listPlans,
  listTrainingLogs,
  saveClient,
} from "@/lib/data-service";
import { formatCurrency, formatDate, todayISO } from "@/lib/format";
import {
  AttendanceRecord,
  Client,
  ClientStatus,
  Payment,
  PaymentMethod,
  Plan,
  TrainingLog,
} from "@/lib/types";

const methodLabels: Record<PaymentMethod, string> = {
  cash: "Efectivo",
  transfer: "Transferencia",
  card: "Tarjeta",
  other: "Otro",
};

export default function ClientProfilePage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [logs, setLogs] = useState<TrainingLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    birth_date: "",
    plan_id: "",
    status: "active" as ClientStatus,
    notes: "",
  });

  const [showLogForm, setShowLogForm] = useState(false);
  const [logDate, setLogDate] = useState(todayISO());
  const [logExercise, setLogExercise] = useState("");
  const [logDetail, setLogDetail] = useState("");
  const [logNotes, setLogNotes] = useState("");

  async function refresh() {
    const [clients, pl, allPayments, allAttendance, clientLogs] = await Promise.all([
      listClients(),
      listPlans(),
      listPayments(),
      listAttendance(),
      listTrainingLogs(clientId),
    ]);
    const found = clients.find((c) => c.id === clientId) ?? null;
    setClient(found);
    setNotFound(!found);
    setPlans(pl);
    setPayments(allPayments.filter((p) => p.client_id === clientId));
    setAttendance(allAttendance.filter((a) => a.client_id === clientId));
    setLogs(clientLogs);
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const paymentGroups = useMemo(() => {
    const map = new Map<string, Payment[]>();
    for (const p of payments) {
      const arr = map.get(p.group_id) ?? [];
      arr.push(p);
      map.set(p.group_id, arr);
    }
    return [...map.values()]
      .map((rows) => [...rows].sort((a, b) => a.installment_number - b.installment_number))
      .sort((a, b) => (a[0].payment_date < b[0].payment_date ? 1 : -1));
  }, [payments]);

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const latestPeriod = client ? findLatestPeriod(payments, client.id) : null;

  function openEdit() {
    if (!client) return;
    setEditForm({
      full_name: client.full_name,
      phone: client.phone ?? "",
      email: client.email ?? "",
      birth_date: client.birth_date ?? "",
      plan_id: client.plan_id ?? "",
      status: client.status,
      notes: client.notes ?? "",
    });
    setShowEdit(true);
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!client || !editForm.full_name.trim()) return;
    await saveClient({
      id: client.id,
      full_name: editForm.full_name.trim(),
      phone: editForm.phone || null,
      email: editForm.email || null,
      birth_date: editForm.birth_date || null,
      plan_id: editForm.plan_id || null,
      status: editForm.status,
      notes: editForm.notes || null,
    });
    setShowEdit(false);
    await refresh();
  }

  function openLogForm() {
    setLogDate(todayISO());
    setLogExercise("");
    setLogDetail("");
    setLogNotes("");
    setShowLogForm(true);
  }

  async function handleLogSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!logExercise.trim()) return;
    await createTrainingLog({
      client_id: clientId,
      date: logDate,
      exercise: logExercise.trim(),
      detail: logDetail || null,
      notes: logNotes || null,
    });
    setShowLogForm(false);
    await refresh();
  }

  async function handleDeleteLog(id: string) {
    if (!confirm("¿Eliminar este registro de progreso?")) return;
    await deleteTrainingLog(id);
    await refresh();
  }

  if (loading) {
    return <div className="h-64 animate-pulse rounded-xl bg-zinc-900" />;
  }

  if (notFound || !client) {
    return (
      <EmptyState
        icon={Dumbbell}
        title="Cliente no encontrado"
        description="Puede que haya sido eliminado."
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <button
        onClick={() => router.push("/clients")}
        className="flex w-fit items-center gap-1.5 text-sm font-medium text-zinc-400 hover:text-zinc-50"
      >
        <ArrowLeft size={15} /> Volver a clientes
      </button>

      <div className="card flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <Avatar name={client.full_name} size={56} />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-zinc-50">{client.full_name}</h1>
              <StatusBadge status={client.status} />
            </div>
            <p className="text-sm text-zinc-400">
              {client.plan?.name ?? "Sin plan"} · Cliente desde {formatDate(client.start_date)}
            </p>
            {(client.phone || client.email) && (
              <p className="text-xs text-zinc-600">
                {[client.phone, client.email].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
        </div>
        <button onClick={openEdit} className="btn-secondary w-fit">
          <Pencil size={13} /> Editar cliente
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Total pagado" value={formatCurrency(totalPaid)} icon={Wallet} accent="green" />
        <StatCard label="Asistencias" value={String(attendance.length)} icon={CalendarCheck} accent="blue" />
        <StatCard
          label="Cubre hasta"
          value={latestPeriod ? formatDate(latestPeriod.period_end) : "Sin pagos"}
          icon={Wallet}
          accent={latestPeriod && latestPeriod.period_end < todayISO() ? "amber" : "green"}
        />
      </div>

      <div className="card p-4">
        <h2 className="mb-2 font-semibold text-zinc-50">Notas</h2>
        <p className="whitespace-pre-line text-sm text-zinc-400">{client.notes || "Sin notas."}</p>
      </div>

      <div className="card">
        <h2 className="border-b border-zinc-800 p-4 font-semibold text-zinc-50">
          Historial de pagos y renovaciones
        </h2>
        {paymentGroups.length === 0 ? (
          <div className="p-4">
            <EmptyState icon={Wallet} title="Aun no hay pagos registrados" />
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-zinc-800">
            {paymentGroups.map((group) => {
              const first = group[0];
              const total = group.reduce((sum, p) => sum + p.amount, 0);
              const plan = plans.find((p) => p.id === first.plan_id);
              return (
                <div key={first.group_id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-zinc-50">{plan?.name ?? "Sin plan"}</p>
                      <p className="text-xs text-zinc-400">
                        {formatDate(first.period_start)} - {formatDate(first.period_end)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-emerald-400">{formatCurrency(total)}</p>
                      <span className="text-xs text-zinc-400">
                        {first.installment_count === 1 ? "Pago completo" : `${first.installment_count} cuotas`}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-col gap-1">
                    {group.map((p) => (
                      <p key={p.id} className="text-xs text-zinc-600">
                        {p.installment_count > 1 ? `Cuota ${p.installment_number}/${p.installment_count} · ` : ""}
                        {formatDate(p.payment_date)} · {methodLabels[p.method]} · {formatCurrency(p.amount)}
                      </p>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="card">
        <div className="flex items-center justify-between border-b border-zinc-800 p-4">
          <h2 className="font-semibold text-zinc-50">Progreso de entrenamiento</h2>
          <button onClick={openLogForm} className="btn-primary">
            <Plus size={15} /> Registrar
          </button>
        </div>
        {logs.length === 0 ? (
          <div className="p-4">
            <EmptyState icon={Dumbbell} title="Aun no hay registros de progreso" />
          </div>
        ) : (
          <ul className="flex flex-col divide-y divide-zinc-800">
            {logs.map((log) => (
              <li key={log.id} className="flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="text-sm font-medium text-zinc-50">
                    {log.exercise} <span className="text-xs text-zinc-600">· {formatDate(log.date)}</span>
                  </p>
                  {log.detail && <p className="text-sm text-zinc-400">{log.detail}</p>}
                  {log.notes && <p className="text-xs text-zinc-600">{log.notes}</p>}
                </div>
                <button
                  onClick={() => handleDeleteLog(log.id)}
                  className="rounded-lg p-1.5 text-red-400 hover:bg-red-500/20"
                  aria-label="Eliminar registro"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showEdit && (
        <Modal title="Editar cliente" onClose={() => setShowEdit(false)}>
          <form onSubmit={handleEditSubmit} onKeyDown={preventEnterSubmit} className="flex flex-col gap-3">
            <Field label="Nombre completo *">
              <input
                required
                value={editForm.full_name}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                className="input"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Telefono">
                <input
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="input"
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="input"
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Fecha de nacimiento">
                <input
                  type="date"
                  value={editForm.birth_date}
                  onChange={(e) => setEditForm({ ...editForm, birth_date: e.target.value })}
                  className="input"
                />
              </Field>
              <Field label="Estado">
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value as ClientStatus })}
                  className="input"
                >
                  <option value="active">Activo</option>
                  <option value="paused">Pausado</option>
                  <option value="inactive">Inactivo</option>
                </select>
              </Field>
            </div>
            <Field label="Plan">
              <select
                value={editForm.plan_id}
                onChange={(e) => setEditForm({ ...editForm, plan_id: e.target.value })}
                className="input"
              >
                <option value="">Sin plan</option>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Notas">
              <textarea
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                className="input"
                rows={3}
              />
            </Field>
            <button type="submit" className="btn-primary mt-2 justify-center">
              Guardar
            </button>
          </form>
        </Modal>
      )}

      {showLogForm && (
        <Modal title="Registrar progreso" onClose={() => setShowLogForm(false)}>
          <form onSubmit={handleLogSubmit} onKeyDown={preventEnterSubmit} className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Fecha">
                <input
                  type="date"
                  value={logDate}
                  onChange={(e) => setLogDate(e.target.value)}
                  className="input"
                />
              </Field>
              <Field label="Ejercicio *">
                <input
                  required
                  value={logExercise}
                  onChange={(e) => setLogExercise(e.target.value)}
                  placeholder="Ej. Sentadilla"
                  className="input"
                />
              </Field>
            </div>
            <Field label="Carga / detalle">
              <input
                value={logDetail}
                onChange={(e) => setLogDetail(e.target.value)}
                placeholder="Ej. 60kg x 8 reps x 3 series"
                className="input"
              />
            </Field>
            <Field label="Notas">
              <textarea
                value={logNotes}
                onChange={(e) => setLogNotes(e.target.value)}
                className="input"
                rows={2}
              />
            </Field>
            <button type="submit" className="btn-primary mt-2 justify-center">
              Guardar registro
            </button>
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
