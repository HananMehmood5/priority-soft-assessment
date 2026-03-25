import type { ReactNode } from "react";
import { ErrorState } from "./ErrorState";
import { PageSkeleton } from "./PageSkeleton";

/** Normalize Apollo errors, `Error`, or string messages for display. */
export function formatQueryError(error: unknown): string {
  if (error == null) return "";
  if (typeof error === "string") return error;
  if (typeof error === "object" && error !== null && "message" in error) {
    const m = (error as { message?: unknown }).message;
    if (typeof m === "string") return m;
  }
  return String(error);
}

function hasBlockingError(error: unknown): boolean {
  if (error == null) return false;
  if (typeof error === "string") return error.length > 0;
  return true;
}

type Props = {
  loading: boolean;
  error: unknown;
  skeletonLines?: number;
  onRetry?: () => void;
  children: ReactNode;
};

/** Shared Apollo-style gate: skeleton while loading, ErrorState when `error` is set, else children. */
export function QueryStateBoundary({
  loading,
  error,
  skeletonLines = 3,
  onRetry,
  children,
}: Props) {
  if (loading) {
    return <PageSkeleton lines={skeletonLines} />;
  }
  if (hasBlockingError(error)) {
    return (
      <ErrorState
        message={formatQueryError(error)}
        onRetry={onRetry}
        variant="card"
      />
    );
  }
  return <>{children}</>;
}
