import type { TableColumn } from "./types";

interface TableHeaderProps<T> {
  columns: TableColumn<T>[];
}

/**
 * Table header component
 */
export const TableHeader = <T,>({
  columns,
}: TableHeaderProps<T>) => {
  return (
    <thead className="bg-brand-muted text-xs uppercase tracking-wide text-brand-subtle">
      <tr>
        {columns.map((column, index) => (
          <th key={index} className={`px-4 py-3 ${column.className || ""}`}>
            {column.header}
          </th>
        ))}
      </tr>
    </thead>
  );
};
