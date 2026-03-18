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
      <div className="rounded-ps border border-ps-border bg-ps-bg-card p-6 shadow-ps">
        <div className="text-sm font-semibold text-ps-fg">{emptyMessage}</div>
        {emptyDescription != null && emptyDescription !== "" && (
          <div className="mt-1 text-sm text-ps-fg-muted">{emptyDescription}</div>
        )}
      </div>
    );
  }
  return <p className="text-sm text-ps-fg-muted">{message ?? "No items found"}</p>;
};
