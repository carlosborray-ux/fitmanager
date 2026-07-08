import { LucideIcon } from "lucide-react";

const palettes = {
  green: { icon: "bg-emerald-500/15 text-emerald-400", value: "text-zinc-50" },
  violet: { icon: "bg-violet-500/15 text-violet-400", value: "text-violet-400" },
  amber: { icon: "bg-amber-500/15 text-amber-400", value: "text-amber-400" },
  blue: { icon: "bg-blue-500/15 text-blue-400", value: "text-zinc-50" },
} as const;

export default function StatCard({
  label,
  value,
  icon: Icon,
  accent = "green",
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  accent?: keyof typeof palettes;
}) {
  const palette = palettes[accent];
  return (
    <div className="card p-4 transition-shadow hover:shadow-lg hover:shadow-black/30">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-zinc-400">{label}</p>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${palette.icon}`}>
          <Icon size={16} strokeWidth={2.25} />
        </span>
      </div>
      <p className={`mt-2 text-2xl font-semibold ${palette.value}`}>{value}</p>
    </div>
  );
}
