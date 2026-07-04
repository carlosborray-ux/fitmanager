export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
      <ul className="divide-y divide-zinc-100">
        {Array.from({ length: rows }).map((_, i) => (
          <li key={i} className="flex items-center gap-3 p-4">
            <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-zinc-100" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-1/3 animate-pulse rounded bg-zinc-100" />
              <div className="h-2.5 w-1/2 animate-pulse rounded bg-zinc-100" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CardGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="h-3 w-2/3 animate-pulse rounded bg-zinc-100" />
          <div className="mt-3 h-6 w-1/2 animate-pulse rounded bg-zinc-100" />
        </div>
      ))}
    </div>
  );
}
