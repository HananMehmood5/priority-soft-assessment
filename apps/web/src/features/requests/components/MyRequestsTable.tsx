import { formatDateTime } from "@/lib/format-date";
import { Table, Th, Tr, Td } from "@/libs/ui/Table";
import { Button } from "@/libs/ui/Button";
import { RequestType, RequestStatus } from "@shiftsync/shared";

export type RequestRow = {
  id: string;
  type: string;
  assignmentId: string;
  counterpartAssignmentId: string | null;
  claimerUserId: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type Props = {
  requests: RequestRow[];
  cancellingId: string | null;
  onCancel: (id: string) => void;
};

const canCancel = (r: RequestRow) =>
  r.status === RequestStatus.Pending || r.status === RequestStatus.Accepted;

export function MyRequestsTable({ requests, cancellingId, onCancel }: Props) {
  if (requests.length === 0) {
    return <p className="text-ps-fg-muted">You have no requests.</p>;
  }

  return (
    <div className="overflow-hidden rounded-ps border border-ps-border bg-ps-bg-card">
      <Table>
        <thead>
          <Tr>
            <Th>Type</Th>
            <Th>Status</Th>
            <Th>Assignment</Th>
            <Th>Created</Th>
            <Th>Actions</Th>
          </Tr>
        </thead>
        <tbody>
          {requests.map((r) => (
            <Tr key={r.id}>
              <Td>{r.type === RequestType.Swap ? "Swap" : "Drop"}</Td>
              <Td>{r.status}</Td>
              <Td className="text-ps-fg-muted">
                {r.assignmentId.slice(0, 8)}
                …
              </Td>
              <Td className="text-ps-fg-muted">
                {formatDateTime(r.createdAt)}
              </Td>
              <Td>
                {canCancel(r) && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={!!cancellingId}
                    onClick={() => onCancel(r.id)}
                  >
                    {cancellingId === r.id ? "Cancelling…" : "Cancel"}
                  </Button>
                )}
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

