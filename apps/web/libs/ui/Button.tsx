import Link from "next/link";
import { ComponentProps, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md";

type CommonProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  className?: string;
};

type ButtonProps = CommonProps &
  ComponentProps<"button"> & {
    href?: undefined;
  };

type LinkButtonProps = CommonProps &
  ComponentProps<"a"> & {
    href: string;
  };

export type Props = ButtonProps | LinkButtonProps;

const baseClasses =
  "inline-flex items-center justify-center rounded-ps px-3 py-2 text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-ps-primary hover:bg-ps-primary-hover text-ps-primary-foreground shadow-ps",
  secondary:
    "border border-ps-border hover:border-ps-fg-subtle hover:bg-ps-surface-hover text-ps-fg",
  ghost:
    "bg-transparent hover:bg-ps-surface-hover text-ps-fg-muted border border-transparent",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "text-xs px-2 py-1",
  md: "",
};

export function Button(props: Props) {
  const {
    children,
    variant = "primary",
    size = "md",
    loading,
    className = "",
    ...rest
  } = props as CommonProps & (ButtonProps | LinkButtonProps);

  const classes = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const content = loading ? "Loading..." : children;

  if ("href" in rest && rest.href) {
    const { href, ...linkProps } = rest;
    return (
      <Link href={href} className={classes} {...linkProps}>
        {content}
      </Link>
    );
  }

  const buttonProps = rest as ComponentProps<"button">;
  return (
    <button
      className={classes}
      disabled={loading || buttonProps.disabled}
      {...buttonProps}
    >
      {content}
    </button>
  );
}

