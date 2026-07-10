const PALETTE = [
  "bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white",
  "bg-gradient-to-br from-blue-500 to-cyan-400 text-white",
  "bg-gradient-to-br from-emerald-500 to-teal-400 text-white",
  "bg-gradient-to-br from-amber-500 to-orange-500 text-white",
  "bg-gradient-to-br from-rose-500 to-pink-500 text-white",
  "bg-gradient-to-br from-cyan-500 to-blue-400 text-white",
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
