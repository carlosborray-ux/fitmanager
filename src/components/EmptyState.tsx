import { LucideIcon } from "lucide-react";

export default function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-zinc-300 bg-white/50 py-10 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-100 text-violet-600">
        <Icon size={20} strokeWidth={2} />
      </span>
      <p className="text-sm font-medium text-zinc-700">{title}</p>
      {description && <p className="max-w-xs text-xs text-zinc-500">{description}</p>}
    </div>
  );
}
