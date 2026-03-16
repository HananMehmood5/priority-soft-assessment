import { ReactNode } from "react";

type TableProps = {
  children: ReactNode;
};

export function Table({ children }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse text-left text-sm">
        {children}
      </table>
    </div>
  );
}

type TableHeadCellProps = {
  children?: ReactNode;
};

export function Th({ children }: TableHeadCellProps) {
  return (
    <th className="border-b border-ps-border px-2 py-3 text-left font-semibold">
      {children}
    </th>
  );
}

type TableRowProps = {
  children: ReactNode;
};

export function Tr({ children }: TableRowProps) {
  return <tr className="border-b border-ps-border">{children}</tr>;
}

type TableCellProps = {
  children: ReactNode;
  className?: string;
};

export function Td({ children, className = "" }: TableCellProps) {
  return (
    <td className={`px-2 py-3 align-top ${className}`.trim()}>
      {children}
    </td>
  );
}

