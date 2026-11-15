import type { ReactNode } from "react";

export function EmptyState({ title, description }: { title: string; description?: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-stone-300 px-4 py-10 text-center">
      <p className="text-sm font-medium text-stone-700">{title}</p>
      {description && <p className="mt-1 text-sm text-stone-500">{description}</p>}
    </div>
  );
}

export function LoadingRows({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-busy>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-12 animate-pulse rounded-lg bg-stone-100" />
      ))}
    </div>
  );
}
