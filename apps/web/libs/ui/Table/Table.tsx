"use client";

import { TableSkeleton } from "../Skeletons";
import type { TableProps } from "./types";
import { getDefaultRowId } from "./utils";
import { Body } from "./Body";
import { EmptyState } from "../EmptyState";
import { ErrorState } from "../ErrorState";
import { TableHeader } from "./TableHeader";
import { Pagination } from "./Pagination";

/**
 * Main Table component with pagination and error handling
 */
export function Table<T extends object = Record<string, unknown>>({
  title,
  headerAction,
  columns,
  data,
  isLoading = false,
  isError = false,
  errorMessage = "Something went wrong",
  emptyMessage = "No items found",
  emptyDescription,
  onRetry,
  pagination,
  getRowId = getDefaultRowId,
  className,
}: TableProps<T>) {
  if (isLoading) {
    return <TableSkeleton />;
  }

  if (isError) {
    return <ErrorState message={errorMessage} onRetry={onRetry} variant="card" />;
  }

  if (data.length === 0) {
    return <EmptyState emptyMessage={emptyMessage} emptyDescription={emptyDescription} />;
  }

  return (
    <div className={className}>
      <div className="overflow-hidden rounded-xl border border-brand-muted bg-brand-surface shadow-card">
        {(title || headerAction) && (
          <div className="border-b border-brand-muted p-4">
            <div className="flex items-center justify-between gap-3">
              {title && <div className="text-sm font-semibold text-brand-text">{title}</div>}
              {headerAction && <div className="shrink-0">{headerAction}</div>}
            </div>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <TableHeader columns={columns} />
            <Body columns={columns} data={data} getRowId={getRowId} />
          </table>
        </div>
      </div>

      {pagination && pagination.total > 0 && <Pagination pagination={pagination} />}
    </div>
  );
}
