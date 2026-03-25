'use client';

import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { useAuth } from '@/lib/auth-context';
import type { LocationAttributes } from '@/app/types';
import { PageHeader } from '@/libs/ui/PageHeader';
import { formatDate, formatDateTime } from '@/lib/format-date';
import { LOCATIONS_QUERY, OVERTIME_DASHBOARD_QUERY } from '@/lib/apollo/operations';

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
  const locationsQuery = useQuery<{
    locations: Pick<LocationAttributes, 'id' | 'name' | 'timezone'>[];
  }>(LOCATIONS_QUERY, {
    skip: !token,
  });

  const entries = data?.overtimeDashboard ?? [];
  const locations = locationsQuery.data?.locations ?? [];
  const isLoading = loading || locationsQuery.loading;
  const queryError = error?.message ?? locationsQuery.error?.message ?? null;

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
        className="mb-6 grid gap-3 rounded-ps border border-ps-border bg-ps-bg-card p-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <div className="min-w-0">
          <label htmlFor="start" className="mb-1 block text-ps-sm">
            Start date
          </label>
          <input
            id="start"
            type="date"
            value={dateStart}
            onChange={(e) => setDateStart(e.target.value)}
            className="w-full rounded-ps border border-ps-border bg-ps-bg px-3 py-2 text-sm text-ps-fg outline-none focus:border-ps-border-focus focus:ring-2 focus:ring-ps-border-focus"
          />
        </div>
        <div className="min-w-0">
          <label htmlFor="end" className="mb-1 block text-ps-sm">
            End date
          </label>
          <input
            id="end"
            type="date"
            value={dateEnd}
            onChange={(e) => setDateEnd(e.target.value)}
            className="w-full rounded-ps border border-ps-border bg-ps-bg px-3 py-2 text-sm text-ps-fg outline-none focus:border-ps-border-focus focus:ring-2 focus:ring-ps-border-focus"
          />
        </div>
        <div className="min-w-0">
          <label htmlFor="locationId" className="mb-1 block text-ps-sm">
            Location
          </label>
          <select
            id="locationId"
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            className="w-full rounded-ps border border-ps-border bg-ps-bg px-3 py-2 text-sm text-ps-fg outline-none focus:border-ps-border-focus focus:ring-2 focus:ring-ps-border-focus"
          >
            <option value="">All locations</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
        </div>
        <div className="self-end lg:justify-self-start">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-ps bg-ps-primary px-4 py-2 text-sm font-semibold text-ps-primary-foreground shadow-ps transition-colors hover:bg-ps-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isLoading}
          >
            {isLoading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
      </form>
      {queryError && (
        <p className="mb-4 rounded-ps border border-ps-error bg-ps-error/10 p-3 text-sm text-ps-error">
          {queryError}
        </p>
      )}
      {isLoading ? (
        <p className="text-ps-fg-muted">Loading…</p>
      ) : entries.length === 0 ? (
        <div className="rounded-ps border border-dashed border-ps-border p-6 text-center text-ps-fg-muted">
          No overtime data for this range.
        </div>
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
                      <span className="inline-block rounded-full border border-rose-500/40 bg-rose-500/10 px-2.5 py-1 text-ps-xs text-rose-300">
                        {e.overtimeHours.toFixed(1)}h at risk
                      </span>
                    ) : (
                      <span className="inline-block rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-ps-xs text-emerald-300">
                        None
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-ps-xs">
                    {e.assignments.map((a, index) => (
                      <div key={`${a.shiftId}-${a.startAt}-${a.endAt}-${index}`}>
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
