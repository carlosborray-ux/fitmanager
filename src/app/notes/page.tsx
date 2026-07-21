"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, StickyNote } from "lucide-react";
import Avatar from "@/components/Avatar";
import EmptyState from "@/components/EmptyState";
import { ListSkeleton } from "@/components/Skeleton";
import { listClients, saveClient } from "@/lib/data-service";
import { Client } from "@/lib/types";

export default function NotesPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    listClients()
      .then(setClients)
      .finally(() => setLoading(false));
  }, []);

  function updateLocalNotes(id: string, notes: string) {
    setClients((prev) => prev.map((c) => (c.id === id ? { ...c, notes } : c)));
  }

  async function persistNotes(client: Client) {
    setSavingId(client.id);
    try {
      await saveClient(client);
    } finally {
      setSavingId(null);
    }
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
        <div className="flex flex-col gap-2">
          {filtered.map((client) => (
            <div key={client.id} className="card flex items-center gap-3 p-3">
              <div className="flex w-32 shrink-0 items-center gap-2 sm:w-44">
                <Avatar name={client.full_name} size={32} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-50">{client.full_name}</p>
                  <p className="truncate text-[11px] text-zinc-400">
                    {client.plan?.sessions_per_period
                      ? `${client.plan.sessions_per_period} clases/plan`
                      : "Sin plan"}
                  </p>
                </div>
              </div>
              <input
                value={client.notes ?? ""}
                onChange={(e) => updateLocalNotes(client.id, e.target.value)}
                onBlur={() => persistNotes(client)}
                placeholder="Nota rapida..."
                className={`input flex-1 text-sm ${savingId === client.id ? "opacity-60" : ""}`}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
