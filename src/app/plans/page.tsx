"use client";

import { useEffect, useState } from "react";
import { ClipboardList, Pencil, Plus, Trash2 } from "lucide-react";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import EmptyState from "@/components/EmptyState";
import { CardGridSkeleton } from "@/components/Skeleton";
import { MAX_PLANS, deletePlan, listPlans, savePlan } from "@/lib/data-service";
import { formatCurrency } from "@/lib/format";
import { Plan } from "@/lib/types";

const emptyForm = {
  id: undefined as string | undefined,
  name: "",
  price: "",
  duration_days: "30",
  sessions_per_period: "12",
  description: "",
};

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Plan | null>(null);

  async function refresh() {
    setPlans(await listPlans());
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  const atLimit = plans.length >= MAX_PLANS;

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
      sessions_per_period: String(plan.sessions_per_period),
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
      sessions_per_period: Number(form.sessions_per_period) || 1,
      description: form.description || null,
    });
    setShowModal(false);
    await refresh();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await deletePlan(deleteTarget.id);
    setDeleteTarget(null);
    await refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-50">Planes</h1>
          <p className="text-sm text-zinc-400">
            {plans.length} de {MAX_PLANS} planes usados
          </p>
        </div>
        <button onClick={openNew} disabled={atLimit} className="btn-primary" title={atLimit ? `Ya tienes el maximo de ${MAX_PLANS} planes` : undefined}>
          <Plus size={16} /> Nuevo plan
        </button>
      </div>

      {atLimit && (
        <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
          Alcanzaste el limite de {MAX_PLANS} planes. Elimina uno que ya no uses para crear otro.
        </p>
      )}

      {loading ? (
        <CardGridSkeleton count={2} />
      ) : plans.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Aun no has creado planes" description="Crea tu primera membresia para asignarla a clientes." />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-zinc-50">{plan.name}</p>
                  <p className="text-sm font-medium text-emerald-400">{formatCurrency(plan.price)}</p>
                  <p className="text-xs text-zinc-400">
                    Cada {plan.duration_days} dias · {plan.sessions_per_period} sesiones incluidas
                  </p>
                  {plan.description && (
                    <p className="mt-1 text-xs text-zinc-400">{plan.description}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(plan)}
                    className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800"
                    aria-label="Editar plan"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(plan)}
                    className="rounded-lg p-1.5 text-red-400 hover:bg-red-500/10"
                    aria-label="Eliminar plan"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title={form.id ? "Editar plan" : "Nuevo plan"} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} onKeyDown={preventEnterSubmit} className="flex flex-col gap-3">
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
            <Field label="Sesiones incluidas por periodo">
              <input
                type="number"
                min={1}
                value={form.sessions_per_period}
                onChange={(e) => setForm({ ...form, sessions_per_period: e.target.value })}
                className="input"
              />
            </Field>
            <Field label="Descripcion">
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="input"
                rows={2}
              />
            </Field>
            <button type="submit" className="btn-primary mt-2 justify-center">
              Guardar
            </button>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Eliminar plan"
          description={`¿Eliminar "${deleteTarget.name}"? Los clientes que lo tengan asignado quedaran sin plan, los pagos ya registrados con este plan perderan esa referencia, y no se podra deshacer.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
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
