import type { AuditEntry } from "@/features/shifts/types/AuditEntry";
import { formatDateTime } from "@/lib/format-date";

type Props = {
  history: AuditEntry[];
  error: string | null;
};

export function ShiftAuditTimeline({ history, error }: Props) {
  return (
    <section className="mt-8">
      <h2 className="mb-2 text-ps-lg font-semibold">Audit history</h2>
      {error && <p className="mb-2 text-ps-error">{error}</p>}
      {history.length === 0 ? (
        <p className="text-ps-fg-muted">No audit entries for this shift.</p>
      ) : (
        <div className="overflow-hidden rounded-ps border border-ps-border bg-ps-bg-card">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-ps-border text-left">
                <th className="px-2 py-2 font-semibold">When</th>
                <th className="px-2 py-2 font-semibold">Action</th>
                <th className="px-2 py-2 font-semibold">User</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id} className="border-b border-ps-border">
                  <td className="px-2 py-2 text-ps-xs">{formatDateTime(h.createdAt)}</td>
                  <td className="px-2 py-2 text-ps-xs">{h.action}</td>
                  <td className="px-2 py-2 text-ps-xs">{h.userId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

