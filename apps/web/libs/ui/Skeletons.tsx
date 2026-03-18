import clsx from "clsx";

export function SkeletonLine({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        "h-4 w-full animate-pulse rounded bg-slate-200 dark:bg-ps-primary-muted",
        className
      )}
    />
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="rounded-xl border border-ps-primary-muted bg-ps-surface shadow-ps">
      <div className="border-b border-ps-primary-muted p-4">
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
