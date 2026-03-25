import type { TablePaginationConfig } from "./types";
import { Button } from "../Button";
import { Select } from "../Select";

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
          <div className="flex items-end gap-2">
            <Select
              value={String(pagination.limit)}
              onChange={handlePageSizeChange}
              label="Show"
              className="w-auto min-w-[4.5rem]"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </Select>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={isFirstPage}
          onClick={() => pagination.onPageChange(pagination.page - 1)}
        >
          Prev
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={isLastPage}
          onClick={() => pagination.onPageChange(pagination.page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
};
