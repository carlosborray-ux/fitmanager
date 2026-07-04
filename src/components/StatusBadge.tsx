import { ClientStatus } from "@/lib/types";

const styles: Record<ClientStatus, string> = {
  active: "bg-emerald-100 text-emerald-700",
  paused: "bg-amber-100 text-amber-700",
  inactive: "bg-zinc-200 text-zinc-600",
};

const labels: Record<ClientStatus, string> = {
  active: "Activo",
  paused: "Pausado",
  inactive: "Inactivo",
};

export default function StatusBadge({ status }: { status: ClientStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
