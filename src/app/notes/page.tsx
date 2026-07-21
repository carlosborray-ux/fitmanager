"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Search, StickyNote } from "lucide-react";
import Avatar from "@/components/Avatar";
import EmptyState from "@/components/EmptyState";
import { ListSkeleton } from "@/components/Skeleton";
import { listClients, saveClient } from "@/lib/data-service";
import { formatDate, todayISO } from "@/lib/format";
import { Client } from "@/lib/types";

function parseNoteLines(notes: string | null): string[] {
  return (notes ?? "").split("\n").map((line) => line.trim()).filter(Boolean);
}

function ClientNoteRow({
  client,
  onAddNote,
}: {
  client: Client;
  onAddNote: (client: Client, line: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const lines = parseNoteLines(client.notes);

  async function handleAdd() {
    const text = draft.trim();
    if (!text) return;
    setSaving(true);
    try {
      await onAddNote(client, `${formatDate(todayISO())}: ${text}`);
      setDraft("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card flex flex-col gap-2 p-3">
      <div className="flex items-center gap-2">
        <Avatar name={client.full_name} size={32} />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-zinc-50">{client.full_name}</p>
          <p className="truncate text-[11px] text-zinc-400">
            {client.plan?.sessions_per_period ? `${client.plan.sessions_per_period} clases/plan` : "Sin plan"}
          </p>
        </div>
      </div>

      {lines.length > 0 && (
        <ul className="flex flex-col gap-1">
          {lines.map((line, i) => (
            <li key={i} className="rounded-lg bg-zinc-800/70 px-2.5 py-1.5 text-xs text-zinc-300">
              {line}
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder="Nueva nota..."
          className="input flex-1 text-sm"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={saving || !draft.trim()}
          className="btn-secondary shrink-0 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={14} /> {saving ? "..." : "Guardar"}
        </button>
      </div>
    </div>
  );
}

export default function NotesPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    listClients()
      .then(setClients)
      .finally(() => setLoading(false));
  }, []);

  async function handleAddNote(client: Client, line: string) {
    const notes = [...parseNoteLines(client.notes), line].join("\n");
    const saved = await saveClient({
      id: client.id,
      full_name: client.full_name,
      phone: client.phone,
      email: client.email,
      birth_date: client.birth_date,
      plan_id: client.plan_id,
      status: client.status,
      notes,
    });
    setClients((prev) => prev.map((c) => (c.id === client.id ? { ...c, notes: saved.notes } : c)));
  }

  const filtered = useMemo(
    () => clients.filter((c) => c.full_name.toLowerCase().includes(search.toLowerCase())),
    [clients, search]
  );

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-2xl font-bold text-transparent">
          Notas
        </h1>
        <p className="text-sm text-zinc-400">Clases del plan y notas rapidas por cliente</p>
      </div>

      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar cliente..."
          className="input pl-9"
        />
      </div>

      {loading ? (
        <ListSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState icon={StickyNote} title="No hay clientes que coincidan" />
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((client) => (
            <ClientNoteRow key={client.id} client={client} onAddNote={handleAddNote} />
          ))}
        </div>
      )}
    </div>
  );
}
