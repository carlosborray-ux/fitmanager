"use client";

import { useEffect, useState } from "react";
import { Pencil, Search, Trash2, UserPlus, Users } from "lucide-react";
import Modal from "@/components/Modal";
import StatusBadge from "@/components/StatusBadge";
import Avatar from "@/components/Avatar";
import EmptyState from "@/components/EmptyState";
import { ListSkeleton } from "@/components/Skeleton";
import {
  deleteClient,
  listClients,
  listPlans,
  saveClient,
} from "@/lib/data-service";
import { formatDate } from "@/lib/format";
import { Client, ClientStatus, Plan } from "@/lib/types";

const emptyForm = {
  id: undefined as string | undefined,
  full_name: "",
  phone: "",
  email: "",
  birth_date: "",
  plan_id: "",
  status: "active" as ClientStatus,
  notes: "",
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");

  async function refresh() {
    const [c, p] = await Promise.all([listClients(), listPlans()]);
    setClients(c);
    setPlans(p);
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  function openNew() {
    setForm(emptyForm);
    setShowModal(true);
  }

  function openEdit(client: Client) {
    setForm({
      id: client.id,
      full_name: client.full_name,
      phone: client.phone ?? "",
      email: client.email ?? "",
      birth_date: client.birth_date ?? "",
      plan_id: client.plan_id ?? "",
      status: client.status,
      notes: client.notes ?? "",
    });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.full_name.trim()) return;
    await saveClient({
      id: form.id,
      full_name: form.full_name.trim(),
      phone: form.phone || null,
      email: form.email || null,
      birth_date: form.birth_date || null,
      plan_id: form.plan_id || null,
      status: form.status,
      notes: form.notes || null,
    });
    setShowModal(false);
    await refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este cliente y su historial de pagos/asistencia?")) return;
    await deleteClient(id);
    await refresh();
  }

  const filtered = clients.filter((c) =>
    c.full_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-50">Clientes</h1>
          <p className="text-sm text-zinc-400">{clients.length} clientes registrados</p>
        </div>
        <button onClick={openNew} className="btn-primary">
          <UserPlus size={16} /> Nuevo cliente
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre..."
          className="input pl-9"
        />
      </div>

      {loading ? (
        <ListSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No hay clientes que coincidan"
          description="Prueba con otro nombre o agrega un nuevo cliente."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-sm">
          <ul className="divide-y divide-zinc-800">
            {filtered.map((client) => (
              <li key={client.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <Avatar name={client.full_name} />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-zinc-50">{client.full_name}</p>
                      <StatusBadge status={client.status} />
                    </div>
                    <p className="text-xs text-zinc-400">
                      {client.plan?.name ?? "Sin plan"} · Desde {formatDate(client.start_date)}
                    </p>
                    {(client.phone || client.email) && (
                      <p className="text-xs text-zinc-600">
                        {[client.phone, client.email].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 pl-[52px] sm:pl-0">
                  <button onClick={() => openEdit(client)} className="btn-secondary">
                    <Pencil size={13} /> Editar
                  </button>
                  <button onClick={() => handleDelete(client.id)} className="btn-danger">
                    <Trash2 size={13} /> Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showModal && (
        <Modal title={form.id ? "Editar cliente" : "Nuevo cliente"} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} onKeyDown={preventEnterSubmit} className="flex flex-col gap-3">
            <Field label="Nombre completo *">
              <input
                required
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="input"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Telefono">
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="input"
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input"
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Fecha de nacimiento">
                <input
                  type="date"
                  value={form.birth_date}
                  onChange={(e) => setForm({ ...form, birth_date: e.target.value })}
                  className="input"
                />
              </Field>
              <Field label="Estado">
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as ClientStatus })}
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
                value={form.plan_id}
                onChange={(e) => setForm({ ...form, plan_id: e.target.value })}
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
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
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
