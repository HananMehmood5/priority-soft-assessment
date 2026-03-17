import { ReactNode } from "react";

/**
 * Configuration for a table column
 */
export interface TableColumn<T> {
  /** Column header text */
  header: string;
  /** Custom render function for cell content */
  render?: (row: T) => ReactNode;
  /** Additional CSS classes for the column */
  className?: string;
}

/**
 * Pagination configuration for the table
 */
export interface TablePaginationConfig {
  /** Current page number (1-indexed) */
  page: number;
  /** Number of items per page */
  limit: number;
  /** Total number of items */
  total: number;
  /** Callback when page changes */
  onPageChange: (page: number) => void;
  /** Callback when page size changes */
  onPageSizeChange?: (pageSize: number) => void;
  /** Available page size options */
  pageSizeOptions?: number[];
}

/**
 * Props for the Table component
 */
export interface TableProps<T> {
  /** Optional title displayed above the table */
  title?: string;
  /** Optional action rendered in the header next to the title */
  headerAction?: ReactNode;
  /** Column definitions */
  columns: TableColumn<T>[];
  /** Array of data to display */
  data: T[];
  /** Whether data is currently loading */
  isLoading?: boolean;
  /** Whether an error occurred */
  isError?: boolean;
  /** Error message to display */
  errorMessage?: string;
  /** Message to display when table is empty */
  emptyMessage?: string;
  /** Additional description for empty state */
  emptyDescription?: string;
  /** Callback to retry loading data */
  onRetry?: () => void;
  /** Pagination configuration */
  pagination?: TablePaginationConfig;
  /** Function to get unique ID for each row */
  getRowId?: (row: T) => string | number;
  /** Additional CSS classes */
  className?: string;
}
