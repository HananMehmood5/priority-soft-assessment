'use client';

import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { useAuth } from '@/lib/auth-context';
import { PageHeader } from '@/libs/ui/PageHeader';
import { formatDate, formatDateTime } from '@/lib/format-date';
import { OVERTIME_DASHBOARD_QUERY } from '@/lib/apollo/operations';

type AssignmentHoursEntry = {
  shiftId: string;
  startAt: string;
  endAt: string;
  hours: number;
};

type DashboardOvertimeEntry = {
  userId: string;
  userName: string | null;
  weekStart: string;
  weeklyHours: number;
  overtimeHours: number;
  assignments: AssignmentHoursEntry[];
};

function getDefaultRange() {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 7);
  const end = new Date(now);
  end.setDate(end.getDate() + 7);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export default function OvertimeDashboardPage() {
  const { token, user } = useAuth();
  const [locationId, setLocationId] = useState('');
  const [dateStart, setDateStart] = useState(getDefaultRange().start);
  const [dateEnd, setDateEnd] = useState(getDefaultRange().end);

  const { data, loading, error, refetch } = useQuery<{
    overtimeDashboard: DashboardOvertimeEntry[];
  }>(OVERTIME_DASHBOARD_QUERY, {
    variables: {
      start: new Date(dateStart).toISOString(),
      end: new Date(dateEnd).toISOString(),
      locationId: locationId || null,
    },
    skip: !token,
  });

  const entries = data?.overtimeDashboard ?? [];

  if (!user || (user.role !== 'Admin' && user.role !== 'Manager')) {
    return <p className="text-ps-error">You do not have access to the overtime dashboard.</p>;
  }

  return (
    <div>
      <PageHeader
        title="Overtime dashboard"
        description="Projected weekly hours and overtime by staff and week. Use this to spot risk before assigning more shifts."
      />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          refetch();
        }}
        className="mb-6 flex flex-wrap gap-3"
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
        <div className="self-end">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-ps bg-ps-primary px-4 py-2 text-sm font-semibold text-ps-primary-foreground shadow-ps transition-colors hover:bg-ps-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading}
          >
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
      </form>
      {error && <p className="mb-3 text-ps-error">{error.message}</p>}
      {loading ? (
        <p className="text-ps-fg-muted">Loading…</p>
      ) : entries.length === 0 ? (
        <p className="text-ps-fg-muted">No overtime data for this range.</p>
      ) : (
        <div className="overflow-hidden rounded-ps border border-ps-border bg-ps-bg-card">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-ps-border text-left">
                <th className="px-3 py-3 font-semibold">Staff</th>
                <th className="px-3 py-3 font-semibold">Week starting</th>
                <th className="px-3 py-3 font-semibold">Weekly hours</th>
                <th className="px-3 py-3 font-semibold">Overtime hours</th>
                <th className="px-3 py-3 font-semibold">Assignments</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={`${e.userId}-${e.weekStart}`} className="border-b border-ps-border">
                  <td className="px-3 py-3">
                    <div>{e.userName ?? e.userId}</div>
                    <div className="text-ps-xs text-ps-fg-muted">{e.userId}</div>
                  </td>
                  <td className="px-3 py-3">{formatDate(e.weekStart)}</td>
                  <td className="px-3 py-3">{e.weeklyHours.toFixed(1)}h</td>
                  <td className="px-3 py-3">
                    {e.overtimeHours > 0 ? (
                      <span className="inline-block rounded-full bg-ps-primary-muted px-2 py-0.5 text-ps-xs text-ps-warning">
                        {e.overtimeHours.toFixed(1)}h at risk
                      </span>
                    ) : (
                      <span className="text-ps-xs text-ps-fg-muted">None</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-ps-xs">
                    {e.assignments.map((a) => (
                      <div key={a.shiftId}>
                        <span className="text-ps-xs text-ps-fg-muted">
                          {formatDateTime(a.startAt)} – {formatDateTime(a.endAt)} (
                          {a.hours.toFixed(1)}h)
                        </span>
                      </div>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
