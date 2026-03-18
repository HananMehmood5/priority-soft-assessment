import type { TableColumn } from "./types";

interface BodyProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  getRowId: (row: T) => string | number;
}

export const Body = <T,>({ columns, data, getRowId }: BodyProps<T>) => {
  return (
    <tbody>
      {data.map((row) => (
        <tr key={getRowId(row)} className="border-t border-ps-primary-muted">
          {columns.map((column, colIndex) => (
            <td key={colIndex} className={`px-4 py-3 ${column.className || ""}`}>
              {column.render ? column.render(row) : null}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
};
