import { Button } from "./Button";

export type ErrorStateProps = {
  message: string;
  onRetry?: () => void;
  /** "inline" = compact row with message + Retry; "card" = full card with subtitle */
  variant?: "inline" | "card";
};

export const ErrorState = ({ message, onRetry, variant = "inline" }: ErrorStateProps) => {
  if (variant === "card") {
    return (
      <div className="rounded-xl border border-ps-primary-muted bg-ps-surface p-6 shadow-ps">
        <div className="text-sm font-semibold text-ps-fg">{message}</div>
        <div className="mt-1 text-sm text-ps-fg-muted">
          Please retry. If this keeps happening, check the API is running.
        </div>
        {onRetry != null && (
          <button
            type="button"
            className="mt-4 rounded-lg bg-ps-primary px-3 py-2 text-sm font-semibold text-ps-primary-foreground hover:bg-ps-primary-hover"
            onClick={onRetry}
          >
            Retry
          </button>
        )}
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-ps-fg-muted">
      <span>{message}</span>
      {onRetry != null && (
        <Button type="button" variant="secondary" size="sm" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
};
