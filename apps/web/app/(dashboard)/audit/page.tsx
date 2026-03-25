"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@apollo/client";
import { useAuth } from "@/lib/auth-context";
import { formatDateTime } from "@/lib/format-date";
import { UserRole } from "@shiftsync/shared";
import { AUDIT_EXPORT_QUERY } from "@/lib/apollo/operations";

import type { AuditEntry } from "@/features/shifts/types/AuditEntry";
import { Table } from "@/libs/ui/Table/Table";
import { PageHeader } from "@/libs/ui/PageHeader";
import { PageSkeleton } from "@/libs/ui/PageSkeleton";
import { Button } from "@/libs/ui/Button";
import { Input } from "@/libs/ui/Input";

const AUDIT_DESCRIPTION = "Export and review audit entries by date range.";

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
  // Avoid SSR/client mismatch by computing defaults only on the client.
  const [dateStart, setDateStart] = useState<string>("");
  const [dateEnd, setDateEnd] = useState<string>("");

  useEffect(() => {
    const range = getDefaultRange();
    setDateStart(range.start);
    setDateEnd(range.end);
  }, []);

  const isAdmin = user?.role === UserRole.Admin;

  const { data, loading, error, refetch } = useQuery<{
    auditExport: AuditEntry[];
  }>(AUDIT_EXPORT_QUERY, {
    variables: {
      // These are only used when the query runs, but we keep them safe for render.
      start: dateStart ? new Date(`${dateStart}T00:00:00`).toISOString() : new Date(0).toISOString(),
      end: dateEnd ? new Date(`${dateEnd}T23:59:59.999`).toISOString() : new Date(0).toISOString(),
      locationId: null,
    },
    skip: !token || !dateStart || !dateEnd || !isAdmin,
  });

  const entries = data?.auditExport ?? [];

  const handleDownload = () => {
    const downloadEntries = entries.map(({ userId, user, ...rest }) => {
      const userLabel =
        user?.name && user?.email ? `${user.name} (${user.email})` : user?.name ?? userId;
      return {
        ...rest,
        user: userLabel,
      };
    });

    const blob = new Blob([JSON.stringify(downloadEntries, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "audit-export.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  if (!user) return <p className="text-ps-fg-muted">Loading…</p>;
  if (!isAdmin) {
    return <p className="text-ps-error">Only admins can access the audit export.</p>;
  }

  if (!dateStart || !dateEnd) {
    return (
      <div>
        <PageHeader title="Audit logs" description={AUDIT_DESCRIPTION} />
        <PageSkeleton lines={2} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Audit logs" description={AUDIT_DESCRIPTION} />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          refetch();
        }}
        className="mb-5 flex flex-wrap items-end justify-between gap-4"
      >
        <div className="flex flex-wrap gap-3">
          <Input
            id="start"
            label="Start date"
            type="date"
            value={dateStart}
            onChange={(e) => setDateStart(e.target.value)}
            className="w-auto"
          />
          <Input
            id="end"
            label="End date"
            type="date"
            value={dateEnd}
            onChange={(e) => setDateEnd(e.target.value)}
            className="w-auto"
          />
        </div>

        <div className="flex gap-2">
          <Button
            type="submit"
            variant="secondary"
            disabled={loading}
            loading={loading}
            loadingLabel="Loading…"
          >
            Refresh
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleDownload}
            disabled={loading}
          >
            Download JSON
          </Button>
        </div>
      </form>
      <Table<AuditEntry>
        title=""
        data={entries}
        isLoading={loading}
        isError={!!error}
        errorMessage={error?.message ?? "Unable to load audit entries."}
        emptyMessage="No audit entries for this range."
        onRetry={() => refetch()}
        columns={[
          {
            header: "When",
            className: "text-ps-xs text-ps-fg-muted",
            render: (row) => formatDateTime(row.createdAt),
          },
          {
            header: "Entity",
            className: "text-ps-xs text-ps-fg",
            render: (row) => <span className="text-ps-xs text-ps-fg">{row.entityType}</span>,
          },
          {
            header: "Action",
            className: "text-ps-xs text-ps-fg",
            render: (row) => <span className="text-ps-xs text-ps-fg">{row.action}</span>,
          },
          {
            header: "User",
            className: "text-ps-xs text-ps-fg",
            render: (row) => (
              <span className="text-ps-xs text-ps-fg">
                {row.user?.name && row.user?.email
                  ? `${row.user.name} (${row.user.email})`
                  : row.user?.name ?? row.userId}
              </span>
            ),
          },
        ]}
        getRowId={(row) => row.id}
      />
    </div>
  );
}
