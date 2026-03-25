import Link from "next/link";
import { ComponentProps, ReactNode } from "react";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "ghostLink"
  | "danger"
  | "destructive";
type ButtonSize = "sm" | "md";

type CommonProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  /** Shown while `loading` is true. */
  loadingLabel?: string;
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
  "inline-flex items-center justify-center gap-2 rounded-ps text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "font-semibold bg-ps-primary hover:bg-ps-primary-hover text-ps-primary-foreground shadow-ps",
  secondary:
    "font-medium border border-ps-border hover:border-ps-fg-subtle hover:bg-ps-surface-hover text-ps-fg",
  ghost:
    "font-medium bg-transparent hover:bg-ps-surface-hover text-ps-fg-muted border border-transparent",
  ghostLink:
    "font-normal text-ps-sm text-ps-fg-muted bg-transparent border border-transparent hover:bg-ps-surface-hover underline-offset-2 hover:underline",
  danger:
    "font-semibold border border-ps-error text-ps-error hover:bg-ps-error/10",
  destructive:
    "font-semibold border border-transparent bg-ps-error text-white shadow-ps hover:bg-ps-error/90",
};

/** Padding lives here so `sm` overrides cleanly without conflicting utilities. */
const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-2 py-1 text-xs",
  md: "px-4 py-2",
};

export function Button(props: Props) {
  const {
    children,
    variant = "primary",
    size = "md",
    loading,
    loadingLabel = "Loading...",
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

  const content = loading ? loadingLabel : children;

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
