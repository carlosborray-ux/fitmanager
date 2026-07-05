import { ClientStatus } from "@/lib/types";

const styles: Record<ClientStatus, { pill: string; dot: string }> = {
  active: { pill: "bg-emerald-500/10 text-emerald-400", dot: "bg-emerald-500" },
  paused: { pill: "bg-amber-500/10 text-amber-400", dot: "bg-amber-500" },
  inactive: { pill: "bg-zinc-800 text-zinc-400", dot: "bg-zinc-700" },
};

const labels: Record<ClientStatus, string> = {
  active: "Activo",
  paused: "Pausado",
  inactive: "Inactivo",
};

export default function StatusBadge({ status }: { status: ClientStatus }) {
  const style = styles[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${style.pill}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {labels[status]}
    </span>
  );
}
