"use client";

import { useEffect, useMemo, useState } from "react";
import { CreditCard, Trash2, Wallet } from "lucide-react";
import Modal from "@/components/Modal";
import Avatar from "@/components/Avatar";
import EmptyState from "@/components/EmptyState";
import { ListSkeleton } from "@/components/Skeleton";
import {
  createPayment,
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

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [clientId, setClientId] = useState("");
  const [planId, setPlanId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [paymentDate, setPaymentDate] = useState(todayISO());
  const [durationDays, setDurationDays] = useState(30);
  const [notes, setNotes] = useState("");

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

  function applyPlan(id: string) {
    setPlanId(id);
    const plan = plansById.get(id);
    if (plan) {
      setAmount(String(plan.price));
      setDurationDays(plan.duration_days);
    }
  }

  function openNew() {
    const firstClient = clients[0];
    setClientId(firstClient?.id ?? "");
    const defaultPlanId = firstClient?.plan_id ?? plans[0]?.id ?? "";
    setPlanId(defaultPlanId);
    const plan = plansById.get(defaultPlanId);
    setAmount(plan ? String(plan.price) : "");
    setMethod("cash");
    setPaymentDate(todayISO());
    setDurationDays(plan?.duration_days ?? 30);
    setNotes("");
    setShowModal(true);
  }

  function handleClientChange(id: string) {
    setClientId(id);
    const client = clients.find((c) => c.id === id);
    if (client?.plan_id) {
      applyPlan(client.plan_id);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId || !amount || !planId) return;
    await createPayment({
      client_id: clientId,
      plan_id: planId,
      amount: Number(amount),
      payment_date: paymentDate,
      period_start: paymentDate,
      period_end: addDaysISO(paymentDate, durationDays),
      method,
      notes: notes || null,
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Pagos</h1>
          <p className="text-sm text-zinc-500">{payments.length} pagos registrados</p>
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
      ) : payments.length === 0 ? (
        <EmptyState icon={Wallet} title="Aun no hay pagos registrados" description="Registra el primer pago de un cliente." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
          <ul className="divide-y divide-zinc-100">
            {payments.map((payment) => (
              <li key={payment.id} className="flex items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-3">
                  <Avatar name={payment.client?.full_name ?? "?"} />
                  <div>
                    <p className="font-medium text-zinc-900">
                      {payment.client?.full_name ?? "Cliente eliminado"}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {plansById.get(payment.plan_id ?? "")?.name ?? "Sin plan"} ·{" "}
                      {formatDate(payment.payment_date)} · {methodLabels[payment.method]} · Cubre
                      hasta {formatDate(payment.period_end)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-semibold text-emerald-700">
                    {formatCurrency(payment.amount)}
                  </p>
                  <button
                    onClick={() => handleDelete(payment.id)}
                    className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                    aria-label="Eliminar pago"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showModal && (
        <Modal title="Registrar pago" onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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
                onChange={(e) => applyPlan(e.target.value)}
                className="input"
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Monto *">
                <input
                  required
                  type="number"
                  min={0}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="input"
                />
              </Field>
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
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Fecha de pago">
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="input"
                />
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-zinc-700">{label}</span>
      {children}
    </label>
  );
}
