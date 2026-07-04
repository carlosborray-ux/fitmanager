import { LucideIcon } from "lucide-react";

const palettes = {
  violet: { icon: "bg-violet-100 text-violet-600", value: "text-zinc-900" },
  green: { icon: "bg-emerald-100 text-emerald-600", value: "text-emerald-700" },
  amber: { icon: "bg-amber-100 text-amber-600", value: "text-amber-700" },
  blue: { icon: "bg-blue-100 text-blue-600", value: "text-zinc-900" },
} as const;

export default function StatCard({
  label,
  value,
  icon: Icon,
  accent = "violet",
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  accent?: keyof typeof palettes;
}) {
  const palette = palettes[accent];
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-zinc-500">{label}</p>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${palette.icon}`}>
          <Icon size={16} strokeWidth={2.25} />
        </span>
      </div>
      <p className={`mt-2 text-2xl font-semibold ${palette.value}`}>{value}</p>
    </div>
  );
}
