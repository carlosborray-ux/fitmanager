export default function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "green" | "red" | "blue" | "zinc";
}) {
  const colors: Record<string, string> = {
    green: "text-emerald-600",
    red: "text-red-600",
    blue: "text-blue-600",
    zinc: "text-zinc-900",
  };
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-medium text-zinc-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${colors[accent ?? "zinc"]}`}>
        {value}
      </p>
    </div>
  );
}
