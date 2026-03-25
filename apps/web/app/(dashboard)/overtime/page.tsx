'use client';

import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { useCanAccessManagerNav } from '@/lib/hooks/use-role';
import { useAuth } from '@/lib/auth-context';
import type { LocationAttributes } from '@/app/types';
import { PageHeader } from '@/libs/ui/PageHeader';
import { formatDate, formatDateTime } from '@/lib/format-date';
import { LOCATIONS_QUERY, OVERTIME_DASHBOARD_QUERY } from '@/lib/apollo/operations';
import { Button } from '@/libs/ui/Button';
import { Input } from '@/libs/ui/Input';
import { Select } from '@/libs/ui/Select';

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

function toISOStringOrNull(value: string): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

export default function OvertimeDashboardPage() {
  const { token, user } = useAuth();
  const [locationId, setLocationId] = useState('');
  const [dateStart, setDateStart] = useState(getDefaultRange().start);
  const [dateEnd, setDateEnd] = useState(getDefaultRange().end);
  const startIso = toISOStringOrNull(dateStart);
  const endIso = toISOStringOrNull(dateEnd);
  const hasValidRange = Boolean(startIso && endIso);
  const canAccess = useCanAccessManagerNav();

  const { data, loading, error, refetch } = useQuery<{
    overtimeDashboard: DashboardOvertimeEntry[];
  }>(OVERTIME_DASHBOARD_QUERY, {
    variables: {
      start: startIso,
      end: endIso,
      locationId: locationId || null,
    },
    skip: !token || !hasValidRange || !canAccess,
  });
  const locationsQuery = useQuery<{
    locations: Pick<LocationAttributes, 'id' | 'name' | 'timezone'>[];
  }>(LOCATIONS_QUERY, {
    skip: !token || !canAccess,
  });

  const entries = data?.overtimeDashboard ?? [];
  const locations = locationsQuery.data?.locations ?? [];
  const isLoading = loading || locationsQuery.loading;
  const queryError = error?.message ?? locationsQuery.error?.message ?? null;

  if (!user) return <p className="text-ps-fg-muted">Loading…</p>;
  if (!canAccess) {
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
        <Input
          id="start"
          label="Start date"
          type="date"
          value={dateStart}
          onChange={(e) => setDateStart(e.target.value)}
          className="min-w-0"
        />
        <Input
          id="end"
          label="End date"
          type="date"
          value={dateEnd}
          onChange={(e) => setDateEnd(e.target.value)}
          className="min-w-0"
        />
        <Select
          id="locationId"
          label="Location"
          value={locationId}
          onChange={(e) => setLocationId(e.target.value)}
          className="min-w-0"
        >
          <option value="">All locations</option>
          {locations.map((location) => (
            <option key={location.id} value={location.id}>
              {location.name}
            </option>
          ))}
        </Select>
        <div className="self-end lg:justify-self-start">
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading || !hasValidRange}
            loading={isLoading}
            loadingLabel="Loading…"
          >
            Refresh
          </Button>
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
