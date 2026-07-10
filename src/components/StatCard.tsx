import { LucideIcon } from "lucide-react";

const palettes = {
  green: { icon: "bg-gradient-to-br from-emerald-500 to-teal-400 text-white shadow-emerald-950/40" },
  violet: { icon: "bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-violet-950/40" },
  amber: { icon: "bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-amber-950/40" },
  blue: { icon: "bg-gradient-to-br from-blue-500 to-cyan-400 text-white shadow-blue-950/40" },
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
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg shadow-sm ${palette.icon}`}>
          <Icon size={16} strokeWidth={2.25} />
        </span>
      </div>
      <p className="mt-2 text-2xl font-semibold text-zinc-50">{value}</p>
    </div>
  );
}
