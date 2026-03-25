import type { ComponentProps, ReactNode } from "react";

type CardPadding = "none" | "sm" | "md";
type CardVariant = "default" | "elevated";

type CardProps = {
  children: ReactNode;
  padding?: CardPadding;
  variant?: CardVariant;
  className?: string;
} & Omit<ComponentProps<"div">, "className">;

const paddingClasses: Record<CardPadding, string> = {
  none: "",
  sm: "p-3",
  md: "p-4",
};

const variantClasses: Record<CardVariant, string> = {
  default: "border border-ps-border bg-ps-bg-card",
  elevated: "border border-ps-border bg-ps-bg-card shadow-ps",
};

/** Rounded surface matching dashboard list rows and panels. */
export function Card({
  children,
  padding = "md",
  variant = "default",
  className = "",
  ...rest
}: CardProps) {
  return (
    <div
      className={[
        "rounded-ps",
        variantClasses[variant],
        paddingClasses[padding],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </div>
  );
}
