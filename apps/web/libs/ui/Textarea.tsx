import type { ComponentProps, ReactNode } from "react";

type Props = {
  label?: string;
  helpText?: ReactNode;
  error?: string | null;
  className?: string;
} & ComponentProps<"textarea">;

export function Textarea({
  label,
  helpText,
  error,
  className = "",
  id,
  ...rest
}: Props) {
  const fieldId = id ?? rest.name;

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={fieldId}
          className="mb-1.5 block text-sm font-medium"
        >
          {label}
        </label>
      )}
      <textarea
        id={fieldId}
        {...rest}
        className={[
          "w-full resize-y rounded-ps border bg-ps-bg-card px-3 py-2.5 text-sm text-ps-fg placeholder:text-ps-fg-subtle",
          "focus:outline-none focus:ring-2 focus:ring-ps-border-focus focus:border-ps-border-focus",
          error ? "border-ps-error" : "border-ps-border",
        ]
          .filter(Boolean)
          .join(" ")}
      />
      {error ? (
        <p className="mt-1 text-ps-xs text-ps-error">{error}</p>
      ) : helpText ? (
        <p className="mt-1 text-ps-xs text-ps-fg-muted">{helpText}</p>
      ) : null}
    </div>
  );
}
