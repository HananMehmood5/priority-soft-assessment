import { ComponentProps, ReactNode } from "react";

type Props = {
  label?: string;
  helpText?: ReactNode;
  error?: string | null;
  className?: string;
} & ComponentProps<"select">;

export function Select({
  label,
  helpText,
  error,
  className = "",
  id,
  ...rest
}: Props) {
  const selectId = id ?? rest.name;

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={selectId}
          className="mb-1.5 block text-sm font-medium"
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        {...rest}
        className={[
          "w-full rounded-ps border bg-ps-bg-card px-3 py-2.5 text-sm text-ps-fg",
          "focus:outline-none focus:ring-2 focus:ring-ps-border-focus focus:border-ps-border-focus",
          error ? "border-ps-error" : "border-ps-border",
        ]
          .filter(Boolean)
          .join(" ")}
      />
      {error ? (
        <p
          className="mt-1 text-ps-xs text-ps-error"
        >
          {error}
        </p>
      ) : helpText ? (
        <p
          className="mt-1 text-ps-xs text-ps-fg-muted"
        >
          {helpText}
        </p>
      ) : null}
    </div>
  );
}

