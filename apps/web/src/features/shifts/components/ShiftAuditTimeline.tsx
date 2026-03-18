import type { AuditEntry } from "@/features/shifts/types/AuditEntry";
import { formatDateTime } from "@/lib/format-date";
import { Table } from "@/libs/ui/Table/Table";

type Props = {
  history: AuditEntry[];
  error: string | null;
};

export function ShiftAuditTimeline({ history, error }: Props) {
  return (
    <section className="mt-8">
      <h2 className="mb-2 text-ps-lg font-semibold">Audit history</h2>
      {error && <p className="mb-2 text-ps-error">{error}</p>}
      <Table<AuditEntry>
        title=""
        data={history}
        emptyMessage="No audit entries for this shift."
        columns={[
          {
            header: "When",
            className: "text-ps-xs text-ps-fg-muted",
            render: (row) => formatDateTime(row.createdAt),
          },
          {
            header: "Action",
            render: (row) => <span className="text-ps-xs text-ps-fg">{row.action}</span>,
          },
          {
            header: "Entity",
            render: (row) => <span className="text-ps-xs text-ps-fg">{row.entityType}</span>,
          },
          {
            header: "User",
            render: (row) => (
              <span className="text-ps-xs text-ps-fg">
                {row.user?.name} ({row.user?.email})
              </span>
            ),
          },
        ]}
        getRowId={(row) => row.id}
      />
    </section>
  );
}
