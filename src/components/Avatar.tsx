const PALETTE = [
  "bg-violet-100 text-violet-700",
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
];

function colorFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

export default function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  return (
    <span
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold ${colorFor(name)}`}
    >
      {initialsFor(name)}
    </span>
  );
}
