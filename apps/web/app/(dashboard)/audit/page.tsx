'use client';

import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { useAuth } from '@/lib/auth-context';
import { formatDateTime } from '@/lib/format-date';
import { UserRole } from '@shiftsync/shared';
import { AUDIT_EXPORT_QUERY } from '@/lib/apollo/operations';

type AuditEntry = {
  id: string;
  userId: string;
  entityId: string;
  entityType: string;
  action: string;
  createdAt: string;
  before?: string | null;
  after?: string | null;
};

function getDefaultRange() {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 7);
  const end = new Date(now);
  end.setDate(end.getDate() + 1);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export default function AuditPage() {
  const { token, user } = useAuth();
  const [locationId, setLocationId] = useState('');
  const [dateStart, setDateStart] = useState(getDefaultRange().start);
  const [dateEnd, setDateEnd] = useState(getDefaultRange().end);

  const { data, loading, error, refetch } = useQuery<{
    auditExport: AuditEntry[];
  }>(AUDIT_EXPORT_QUERY, {
    variables: {
      start: new Date(dateStart).toISOString(),
      end: new Date(dateEnd).toISOString(),
      locationId: locationId || null,
    },
    skip: !token,
  });

  const entries = data?.auditExport ?? [];

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(entries, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'audit-export.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  if (!user || user.role !== UserRole.Admin) {
    return <p className="text-ps-error">Only admins can access the audit export.</p>;
  }

  return (
    <div>
      <h1 className="mb-3 text-2xl font-bold">Audit logs</h1>
      <p className="mb-4 text-ps-fg-muted">
        Export and review audit entries by date range and location.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          refetch();
        }}
        className="mb-5 flex flex-wrap gap-3"
      >
        <div>
          <label htmlFor="start" className="mb-1 block text-ps-sm">
            Start date
          </label>
          <input
            id="start"
            type="date"
            value={dateStart}
            onChange={(e) => setDateStart(e.target.value)}
            className="rounded-ps border border-ps-border bg-ps-bg-card px-3 py-2 text-sm text-ps-fg outline-none focus:border-ps-border-focus focus:ring-2 focus:ring-ps-border-focus"
          />
        </div>
        <div>
          <label htmlFor="end" className="mb-1 block text-ps-sm">
            End date
          </label>
          <input
            id="end"
            type="date"
            value={dateEnd}
            onChange={(e) => setDateEnd(e.target.value)}
            className="rounded-ps border border-ps-border bg-ps-bg-card px-3 py-2 text-sm text-ps-fg outline-none focus:border-ps-border-focus focus:ring-2 focus:ring-ps-border-focus"
          />
        </div>
        <div>
          <label htmlFor="locationId" className="mb-1 block text-ps-sm">
            Location ID (optional)
          </label>
          <input
            id="locationId"
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            placeholder="Filter by location…"
            className="rounded-ps border border-ps-border bg-ps-bg-card px-3 py-2 text-sm text-ps-fg outline-none focus:border-ps-border-focus focus:ring-2 focus:ring-ps-border-focus"
          />
        </div>
        <div className="flex gap-2 self-end">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center rounded-ps border border-ps-border px-4 py-2 text-sm font-medium text-ps-fg transition-colors hover:border-ps-fg-subtle hover:bg-ps-surface-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Loading…' : 'Refresh'}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-ps bg-ps-primary px-4 py-2 text-sm font-semibold text-ps-primary-foreground shadow-ps transition-colors hover:bg-ps-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            Download JSON
          </button>
        </div>
      </form>
      {error && <p className="mb-3 text-ps-error">{error.message}</p>}
      {loading ? (
        <p className="text-ps-fg-muted">Loading…</p>
      ) : entries.length === 0 ? (
        <p className="text-ps-fg-muted">No audit entries for this range.</p>
      ) : (
        <div className="overflow-hidden rounded-ps border border-ps-border bg-ps-bg-card">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-ps-border text-left">
                <th className="px-2 py-2 font-semibold">When</th>
                <th className="px-2 py-2 font-semibold">Entity</th>
                <th className="px-2 py-2 font-semibold">Action</th>
                <th className="px-2 py-2 font-semibold">User</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-b border-ps-border">
                  <td className="px-2 py-2 text-ps-xs">{formatDateTime(e.createdAt)}</td>
                  <td className="px-2 py-2 text-ps-xs">
                    {e.entityType} {e.entityId}
                  </td>
                  <td className="px-2 py-2 text-ps-xs">{e.action}</td>
                  <td className="px-2 py-2 text-ps-xs">{e.userId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
