import type { TablePaginationConfig } from "./types";

interface PaginationProps {
  pagination: TablePaginationConfig;
}

const DEFAULT_PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100];

/**
 * @name Pagination
 * @description
 * Pagination controls for the table
 */
export const Pagination = ({ pagination }: PaginationProps) => {
  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.limit));
  const isFirstPage = pagination.page <= 1;
  const isLastPage = pagination.page * pagination.limit >= pagination.total;
  const pageSizeOptions = pagination.pageSizeOptions ?? DEFAULT_PAGE_SIZE_OPTIONS;

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPageSize = Number(e.target.value);
    if (pagination.onPageSizeChange) {
      pagination.onPageSizeChange(newPageSize);
      // Reset to page 1 when page size changes
      pagination.onPageChange(1);
    }
  };

  return (
    <div className="flex items-center justify-between mt-4">
      <div className="flex items-center gap-4">
        <div className="text-sm text-ps-fg-muted">
          Page {pagination.page} of {totalPages}
          {" • "}
          {pagination.total} total
        </div>
        {pagination.onPageSizeChange && (
          <div className="flex items-center gap-2">
            <label className="text-sm text-ps-fg-muted">Show:</label>
            <select
              value={pagination.limit}
              onChange={handlePageSizeChange}
              className="rounded-lg border border-ps-primary-muted bg-ps-surface px-2 py-1.5 text-sm text-ps-fg focus:outline-none focus:ring-2 focus:ring-ps-border-focus"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <button
          className="rounded-lg border border-ps-primary-muted bg-ps-surface px-3 py-2 text-sm text-ps-fg hover:bg-ps-primary-muted disabled:opacity-50"
          disabled={isFirstPage}
          onClick={() => pagination.onPageChange(pagination.page - 1)}
        >
          Prev
        </button>
        <button
          className="rounded-lg border border-ps-primary-muted bg-ps-surface px-3 py-2 text-sm text-ps-fg hover:bg-ps-primary-muted disabled:opacity-50"
          disabled={isLastPage}
          onClick={() => pagination.onPageChange(pagination.page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
};
