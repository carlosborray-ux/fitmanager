"use client";

import { useEffect, useMemo, useState } from "react";
import Modal from "@/components/Modal";
import {
  createPayment,
  deletePayment,
  listClients,
  listPayments,
} from "@/lib/data-service";
import { addDaysISO, formatCurrency, formatDate, todayISO } from "@/lib/format";
import { Client, Payment, PaymentMethod } from "@/lib/types";

const methodLabels: Record<PaymentMethod, string> = {
  cash: "Efectivo",
  transfer: "Transferencia",
  card: "Tarjeta",
  other: "Otro",
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [clientId, setClientId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [paymentDate, setPaymentDate] = useState(todayISO());
  const [durationDays, setDurationDays] = useState(30);
  const [notes, setNotes] = useState("");

  async function refresh() {
    const [p, c] = await Promise.all([listPayments(), listClients()]);
    setPayments(p);
    setClients(c);
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === clientId),
    [clients, clientId]
  );

  function openNew() {
    setClientId(clients[0]?.id ?? "");
    setAmount(clients[0]?.plan?.price ? String(clients[0].plan.price) : "");
    setMethod("cash");
    setPaymentDate(todayISO());
    setDurationDays(clients[0]?.plan?.duration_days ?? 30);
    setNotes("");
    setShowModal(true);
  }

  function handleClientChange(id: string) {
    setClientId(id);
    const client = clients.find((c) => c.id === id);
    if (client?.plan) {
      setAmount(String(client.plan.price));
      setDurationDays(client.plan.duration_days);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId || !amount) return;
    await createPayment({
      client_id: clientId,
      plan_id: selectedClient?.plan_id ?? null,
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Pagos</h1>
          <p className="text-sm text-zinc-500">{payments.length} pagos registrados</p>
        </div>
        <button
          onClick={openNew}
          disabled={clients.length === 0}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          + Registrar pago
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">Cargando...</p>
      ) : payments.length === 0 ? (
        <p className="text-sm text-zinc-500">Aun no hay pagos registrados.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
          <ul className="divide-y divide-zinc-100">
            {payments.map((payment) => (
              <li key={payment.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium text-zinc-900">
                    {payment.client?.full_name ?? "Cliente eliminado"}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {formatDate(payment.payment_date)} · {methodLabels[payment.method]} · Cubre
                    hasta {formatDate(payment.period_end)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-semibold text-emerald-700">
                    {formatCurrency(payment.amount)}
                  </p>
                  <button
                    onClick={() => handleDelete(payment.id)}
                    className="text-xs font-medium text-red-600 hover:underline"
                  >
                    Eliminar
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
            <button
              type="submit"
              className="mt-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
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
