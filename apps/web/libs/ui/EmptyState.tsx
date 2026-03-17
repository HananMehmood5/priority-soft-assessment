export type EmptyStateProps = {
  /** Inline style: single line of text (e.g. "No comments yet.") */
  message?: string;
  /** Card style: title line (e.g. "No items found") */
  emptyMessage?: string;
  /** Card style: optional description below title */
  emptyDescription?: string;
};

export const EmptyState = ({ message, emptyMessage, emptyDescription }: EmptyStateProps) => {
  if (emptyMessage != null) {
    return (
      <div className="rounded-xl border border-brand-muted bg-brand-surface p-6 shadow-card">
        <div className="text-sm font-semibold text-brand-text">{emptyMessage}</div>
        {emptyDescription != null && emptyDescription !== "" && (
          <div className="mt-1 text-sm text-brand-subtle">{emptyDescription}</div>
        )}
      </div>
    );
  }
  return <p className="text-sm text-brand-subtle">{message ?? "No items found"}</p>;
};
