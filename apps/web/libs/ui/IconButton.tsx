import type { ComponentProps, ReactNode } from "react";

type Props = Omit<ComponentProps<"button">, "type" | "className"> & {
  children: ReactNode;
  className?: string;
};

/** Compact icon-only control (e.g. date/time picker affordance beside an input). */
export function IconButton({ children, className = "", ...rest }: Props) {
  return (
    <button
      type="button"
      className={[
        "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-ps text-ps-fg-muted transition-colors hover:bg-ps-surface-hover hover:text-ps-fg",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </button>
  );
}
