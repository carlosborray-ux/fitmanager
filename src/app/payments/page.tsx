"use client";

import { useEffect, useMemo, useState } from "react";
import { CreditCard, Trash2, Wallet } from "lucide-react";
import Modal from "@/components/Modal";
import Avatar from "@/components/Avatar";
import EmptyState from "@/components/EmptyState";
import { ListSkeleton } from "@/components/Skeleton";
import {
  createPaymentInstallments,
  deletePayment,
  listClients,
  listPayments,
  listPlans,
} from "@/lib/data-service";
import { addDaysISO, formatCurrency, formatDate, todayISO } from "@/lib/format";
import { Client, Payment, PaymentMethod, Plan } from "@/lib/types";

const methodLabels: Record<PaymentMethod, string> = {
  cash: "Efectivo",
  transfer: "Transferencia",
  card: "Tarjeta",
  other: "Otro",
};

function splitAmount(total: number, count: number): number[] {
  const base = Math.floor(total / count);
  const remainder = total - base * count;
  return Array.from({ length: count }, (_, i) => (i === count - 1 ? base + remainder : base));
}

function defaultInstallmentDates(firstDate: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => addDaysISO(firstDate, i * 15));
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [clientId, setClientId] = useState("");
  const [planId, setPlanId] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [durationDays, setDurationDays] = useState(30);
  const [notes, setNotes] = useState("");
  const [installmentCount, setInstallmentCount] = useState(1);
  const [installmentAmounts, setInstallmentAmounts] = useState<string[]>(["0"]);
  const [installmentDates, setInstallmentDates] = useState<string[]>([todayISO()]);

  async function refresh() {
    const [p, c, pl] = await Promise.all([listPayments(), listClients(), listPlans()]);
    setPayments(p);
    setClients(c);
    setPlans(pl);
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  const plansById = useMemo(() => new Map(plans.map((p) => [p.id, p])), [plans]);

  function applyPlan(id: string, count: number) {
    setPlanId(id);
    const plan = plansById.get(id);
    const total = plan?.price ?? 0;
    setDurationDays(plan?.duration_days ?? 30);
    setInstallmentAmounts(splitAmount(total, count).map(String));
  }

  function changeInstallmentCount(count: number) {
    setInstallmentCount(count);
    const plan = plansById.get(planId);
    const total = plan?.price ?? 0;
    setInstallmentAmounts(splitAmount(total, count).map(String));
    setInstallmentDates(defaultInstallmentDates(installmentDates[0] ?? todayISO(), count));
  }

  function openNew() {
    const firstClient = clients[0];
    const defaultPlanId = firstClient?.plan_id ?? plans[0]?.id ?? "";
    const plan = plansById.get(defaultPlanId);
    setClientId(firstClient?.id ?? "");
    setPlanId(defaultPlanId);
    setMethod("cash");
    setDurationDays(plan?.duration_days ?? 30);
    setNotes("");
    setInstallmentCount(1);
    setInstallmentAmounts([String(plan?.price ?? 0)]);
    setInstallmentDates([todayISO()]);
    setShowModal(true);
  }

  function handleClientChange(id: string) {
    setClientId(id);
    const client = clients.find((c) => c.id === id);
    if (client?.plan_id) {
      applyPlan(client.plan_id, installmentCount);
    }
  }

  function updateInstallmentAmount(index: number, value: string) {
    setInstallmentAmounts((amounts) => amounts.map((a, i) => (i === index ? value : a)));
  }

  function updateInstallmentDate(index: number, value: string) {
    setInstallmentDates((dates) => dates.map((d, i) => (i === index ? value : d)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId || !planId) return;
    const periodStart = installmentDates[0];
    await createPaymentInstallments({
      client_id: clientId,
      plan_id: planId,
      period_start: periodStart,
      period_end: addDaysISO(periodStart, durationDays),
      method,
      notes: notes || null,
      installments: installmentAmounts.map((amount, i) => ({
        amount: Number(amount) || 0,
        payment_date: installmentDates[i],
      })),
    });
    setShowModal(false);
    await refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este pago?")) return;
    await deletePayment(id);
    await refresh();
  }

  const canRegister = clients.length > 0 && plans.length > 0;

  const groups = useMemo(() => {
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Pagos</h1>
          <p className="text-sm text-zinc-500">{groups.length} compras registradas</p>
        </div>
        <button
          onClick={openNew}
          disabled={!canRegister}
          className="btn-primary"
          title={!canRegister ? "Necesitas al menos un cliente y un plan creados" : undefined}
        >
          <CreditCard size={16} /> Registrar pago
        </button>
      </div>

      {loading ? (
        <ListSkeleton />
      ) : groups.length === 0 ? (
        <EmptyState icon={Wallet} title="Aun no hay pagos registrados" description="Registra el primer pago de un cliente." />
      ) : (
        <div className="flex flex-col gap-3">
          {groups.map((group) => {
            const first = group[0];
            const total = group.reduce((sum, p) => sum + p.amount, 0);
            const plan = plansById.get(first.plan_id ?? "");
            return (
              <div key={first.group_id} className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
                <div className="flex items-center justify-between gap-3 border-b border-zinc-100 p-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={first.client?.full_name ?? "?"} />
                    <div>
                      <p className="font-medium text-zinc-900">
                        {first.client?.full_name ?? "Cliente eliminado"}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {plan?.name ?? "Sin plan"} · Cubre hasta {formatDate(first.period_end)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-emerald-700">{formatCurrency(total)}</p>
                    <span className="text-xs text-zinc-500">
                      {first.installment_count === 1 ? "Pago completo" : `${first.installment_count} cuotas`}
                    </span>
                  </div>
                </div>
                <ul className="divide-y divide-zinc-100">
                  {group.map((payment) => (
                    <li key={payment.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                      <div>
                        <p className="text-sm text-zinc-700">
                          {payment.installment_count > 1
                            ? `Cuota ${payment.installment_number} de ${payment.installment_count}`
                            : "Pago unico"}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {formatDate(payment.payment_date)} · {methodLabels[payment.method]}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-sm font-medium text-zinc-900">{formatCurrency(payment.amount)}</p>
                        <button
                          onClick={() => handleDelete(payment.id)}
                          className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                          aria-label="Eliminar cuota"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <Modal title="Registrar pago" onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} onKeyDown={preventEnterSubmit} className="flex flex-col gap-3">
            <Field label="Cliente *">
              <select
                required
                value={clientId}
                onChange={(e) => handleClientChange(e.target.value)}
                className="input"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Plan *">
              <select
                required
                value={planId}
                onChange={(e) => applyPlan(e.target.value, installmentCount)}
                className="input"
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>

            <div className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-zinc-700">Cuotas</span>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => changeInstallmentCount(count)}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                      installmentCount === count
                        ? "border-violet-600 bg-violet-600 text-white"
                        : "border-zinc-300 text-zinc-700 hover:bg-zinc-50"
                    }`}
                  >
                    {count === 1 ? "Completo" : `${count} cuotas`}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {installmentAmounts.map((amount, i) => (
                <div key={i} className="grid grid-cols-2 gap-3 rounded-lg border border-zinc-200 p-2.5">
                  <Field label={installmentCount > 1 ? `Cuota ${i + 1}: monto` : "Monto *"}>
                    <input
                      required
                      type="number"
                      min={0}
                      value={amount}
                      onChange={(e) => updateInstallmentAmount(i, e.target.value)}
                      className="input"
                    />
                  </Field>
                  <Field label={installmentCount > 1 ? `Cuota ${i + 1}: fecha` : "Fecha de pago"}>
                    <input
                      type="date"
                      required
                      value={installmentDates[i]}
                      onChange={(e) => updateInstallmentDate(i, e.target.value)}
                      className="input"
                    />
                  </Field>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Metodo">
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                  className="input"
                >
                  <option value="cash">Efectivo</option>
                  <option value="transfer">Transferencia</option>
                  <option value="card">Tarjeta</option>
                  <option value="other">Otro</option>
                </select>
              </Field>
              <Field label="Dias que cubre">
                <input
                  type="number"
                  min={1}
                  value={durationDays}
                  onChange={(e) => setDurationDays(Number(e.target.value))}
                  className="input"
                />
              </Field>
            </div>
            <Field label="Notas">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input"
                rows={2}
              />
            </Field>
            <button type="submit" className="btn-primary mt-2 justify-center">
              Guardar pago
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
      <span className="font-medium text-zinc-700">{label}</span>
      {children}
    </label>
  );
}
