"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import { deletePlan, listPlans, savePlan } from "@/lib/data-service";
import { formatCurrency } from "@/lib/format";
import { Plan } from "@/lib/types";

const emptyForm = {
  id: undefined as string | undefined,
  name: "",
  price: "",
  duration_days: "30",
  description: "",
};

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);

  async function refresh() {
    setPlans(await listPlans());
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  function openNew() {
    setForm(emptyForm);
    setShowModal(true);
  }

  function openEdit(plan: Plan) {
    setForm({
      id: plan.id,
      name: plan.name,
      price: String(plan.price),
      duration_days: String(plan.duration_days),
      description: plan.description ?? "",
    });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    await savePlan({
      id: form.id,
      name: form.name.trim(),
      price: Number(form.price) || 0,
      duration_days: Number(form.duration_days) || 30,
      description: form.description || null,
    });
    setShowModal(false);
    await refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este plan? Los clientes que lo tengan asignado quedaran sin plan.")) return;
    await deletePlan(id);
    await refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Planes</h1>
          <p className="text-sm text-zinc-500">Membresias que ofreces a tus clientes</p>
        </div>
        <button
          onClick={openNew}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          + Nuevo plan
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">Cargando...</p>
      ) : plans.length === 0 ? (
        <p className="text-sm text-zinc-500">Aun no has creado planes.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {plans.map((plan) => (
            <div key={plan.id} className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-zinc-900">{plan.name}</p>
                  <p className="text-sm text-emerald-700">{formatCurrency(plan.price)}</p>
                  <p className="text-xs text-zinc-500">Cada {plan.duration_days} dias</p>
                  {plan.description && (
                    <p className="mt-1 text-xs text-zinc-500">{plan.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(plan)}
                    className="text-xs font-medium text-zinc-600 hover:underline"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(plan.id)}
                    className="text-xs font-medium text-red-600 hover:underline"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title={form.id ? "Editar plan" : "Nuevo plan"} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <Field label="Nombre *">
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Precio *">
                <input
                  required
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="input"
                />
              </Field>
              <Field label="Duracion (dias)">
                <input
                  type="number"
                  min={1}
                  value={form.duration_days}
                  onChange={(e) => setForm({ ...form, duration_days: e.target.value })}
                  className="input"
                />
              </Field>
            </div>
            <Field label="Descripcion">
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="input"
                rows={2}
              />
            </Field>
            <button
              type="submit"
              className="mt-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Guardar
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
