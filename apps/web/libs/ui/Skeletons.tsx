import clsx from "clsx";

export function SkeletonLine({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        "h-4 w-full animate-pulse rounded bg-slate-200 dark:bg-brand-muted",
        className
      )}
    />
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="rounded-xl border border-brand-muted bg-brand-surface shadow-card">
      <div className="border-b border-brand-muted p-4">
        <SkeletonLine className="h-5 w-40" />
      </div>
      <div className="p-4">
        <div className="grid gap-3">
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonLine key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
