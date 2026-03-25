import { Table } from "@/libs/ui/Table/Table";
import { Button } from "@/libs/ui/Button";
import type { ShiftAssignmentAttributes } from "@shiftsync/shared";
import { formatDateTime } from "@/lib/format-date";

type AssignmentRow = ShiftAssignmentAttributes & {
  user?: { id: string; name?: string | null; email?: string | null } | null;
  skill?: { id: string; name: string } | null;
};

type Props = {
  assignments: AssignmentRow[];
  onAddAssignmentClick?: () => void;
};

export function ShiftAssignmentsTable({ assignments, onAddAssignmentClick }: Props) {
  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-ps-fg">Current assignments</h2>
        {onAddAssignmentClick && (
          <Button type="button" size="sm" variant="primary" onClick={onAddAssignmentClick}>
            <span className="mr-1" aria-hidden="true">
              +
            </span>
            Add assignment
          </Button>
        )}
      </div>

      <Table<AssignmentRow>
        data={assignments}
        emptyMessage="No one is assigned to this shift yet."
        emptyDescription="Use the Add assignment button to assign staff to this shift."
        columns={[
          {
            header: "Staff",
            render: (row) => (
              <span className="text-sm text-ps-fg">
                {row.user?.name} ({row.user?.email})
              </span>
            ),
          },
          {
            header: "Skill",
            render: (row) => <span className="text-sm text-ps-fg">{row.skill?.name}</span>,
          },
          {
            header: "Created at",
            className: "text-ps-sm text-ps-fg-muted",
            render: (row) => <span>{formatDateTime(row.createdAt)}</span>,
          },
          {
            header: "Last updated",
            className: "text-ps-sm text-ps-fg-muted",
            render: (row) => <span>{formatDateTime(row.updatedAt ?? row.createdAt)}</span>,
          },
        ]}
        getRowId={(row) => row.id}
      />
    </section>
  );
}
