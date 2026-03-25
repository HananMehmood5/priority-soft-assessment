'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@apollo/client';
import { useAuth } from '@/lib/auth-context';
import type { LocationAttributes } from '@/app/types';
import { UserRole } from '@shiftsync/shared';
import {
  DISTRIBUTION_QUERY,
  PREMIUM_FAIRNESS_QUERY,
  DESIRED_HOURS_QUERY,
  LOCATIONS_QUERY,
} from '@/lib/apollo/operations';

type DistributionEntry = {
  userId: string;
  userName: string | null;
  totalHours: number;
};

type PremiumFairnessEntry = {
  userId: string;
  userName: string | null;
  premiumShiftCount: number;
  totalShiftCount: number;
  totalHours: number;
  fairnessScore: number;
};

type DesiredHoursEntry = {
  userId: string;
  userName: string | null;
  desiredWeeklyHours: number;
  actualHours: number;
  status: 'under' | 'over' | 'ok';
  difference: number;
};

function getDefaultRange() {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 28);
  const end = new Date(now);
  end.setDate(end.getDate() + 1);
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

const vars = (dateStart: string, dateEnd: string, locationId: string) => {
  const start = toISOStringOrNull(dateStart);
  const end = toISOStringOrNull(dateEnd);
  if (!start || !end) return null;
  return {
    start,
    end,
    locationId: locationId || null,
  };
};

export default function FairnessPage() {
  const { token, user } = useAuth();
  const [locationId, setLocationId] = useState('');
  const [role, setRole] = useState<UserRole | ''>('');
  const [dateStart, setDateStart] = useState(getDefaultRange().start);
  const [dateEnd, setDateEnd] = useState(getDefaultRange().end);

  const baseVars = useMemo(() => vars(dateStart, dateEnd, locationId), [dateStart, dateEnd, locationId]);
  const canAccess =
    user?.role === UserRole.Admin || user?.role === UserRole.Manager;
  const shouldSkipReportQueries = !token || !baseVars || !canAccess;

  const distQuery = useQuery<{ reportDistribution: DistributionEntry[] }>(
    DISTRIBUTION_QUERY,
    { variables: baseVars ?? undefined, skip: shouldSkipReportQueries }
  );
  const premQuery = useQuery<{ reportPremiumFairness: PremiumFairnessEntry[] }>(
    PREMIUM_FAIRNESS_QUERY,
    { variables: baseVars ?? undefined, skip: shouldSkipReportQueries }
  );
  const desiredQuery = useQuery<{ reportDesiredHours: DesiredHoursEntry[] }>(
    DESIRED_HOURS_QUERY,
    {
      variables: baseVars ? { ...baseVars, role: role || null } : undefined,
      skip: shouldSkipReportQueries,
    }
  );
  const locationsQuery = useQuery<{
    locations: Pick<LocationAttributes, 'id' | 'name' | 'timezone'>[];
  }>(LOCATIONS_QUERY, {
    skip: !token || !canAccess,
  });

  const loading =
    distQuery.loading || premQuery.loading || desiredQuery.loading || locationsQuery.loading;
  const error =
    distQuery.error?.message ??
    premQuery.error?.message ??
    desiredQuery.error?.message ??
    locationsQuery.error?.message ??
    null;
  const distribution = distQuery.data?.reportDistribution ?? [];
  const premium = premQuery.data?.reportPremiumFairness ?? [];
  const desired = desiredQuery.data?.reportDesiredHours ?? [];
  const locations = locationsQuery.data?.locations ?? [];

  const refetchAll = () => {
    if (!baseVars) return;
    distQuery.refetch();
    premQuery.refetch();
    desiredQuery.refetch();
    locationsQuery.refetch();
  };

  if (!user) return <p className="text-ps-fg-muted">Loading…</p>;
  if (!canAccess) {
    return <p className="text-ps-error">You do not have access to fairness reports.</p>;
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Fairness reports</h1>
      <p className="mb-4 text-ps-fg-muted">
        Compare distribution of hours, premium shifts, and desired vs actual hours for your staff.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          refetchAll();
        }}
        className="mb-6 grid gap-3 rounded-ps border border-ps-border bg-ps-bg-card p-4 sm:grid-cols-2 lg:grid-cols-5"
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
        <div className="min-w-0">
          <label htmlFor="role" className="mb-1 block text-ps-sm">
            Staff role (optional)
          </label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole | '')}
            className="w-full rounded-ps border border-ps-border bg-ps-bg px-3 py-2 text-sm text-ps-fg outline-none focus:border-ps-border-focus focus:ring-2 focus:ring-ps-border-focus"
          >
            <option value="">All roles</option>
            <option value={UserRole.Staff}>Staff</option>
            <option value={UserRole.Manager}>Manager</option>
            <option value={UserRole.Admin}>Admin</option>
          </select>
        </div>
        <div className="self-end lg:justify-self-start">
          <button
            type="submit"
            disabled={loading || !baseVars}
            className="inline-flex items-center justify-center rounded-ps bg-ps-primary px-4 py-2 text-sm font-semibold text-ps-primary-foreground shadow-ps transition-colors hover:bg-ps-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
      </form>
      {error && (
        <p className="mb-4 rounded-ps border border-ps-error bg-ps-error/10 p-3 text-sm text-ps-error">
          {error}
        </p>
      )}
      {loading ? (
        <p className="text-ps-fg-muted">Loading…</p>
      ) : (
        <>
          <section className="mb-6">
            <h2 className="mb-2 text-ps-lg font-semibold">Hours distribution</h2>
            {distribution.length === 0 ? (
              <div className="rounded-ps border border-dashed border-ps-border p-4 text-sm text-ps-fg-muted">
                No data.
              </div>
            ) : (
              <div className="overflow-hidden rounded-ps border border-ps-border bg-ps-bg-card">
                <table className="min-w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-ps-border text-left">
                      <th className="px-2 py-2 font-semibold">Staff</th>
                      <th className="px-2 py-2 font-semibold">Total hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {distribution.map((d) => (
                      <tr key={d.userId} className="border-b border-ps-border">
                        <td className="px-2 py-2">
                          {d.userName ?? d.userId}
                          <div className="text-ps-xs text-ps-fg-muted">{d.userId}</div>
                        </td>
                        <td className="px-2 py-2">{d.totalHours.toFixed(1)}h</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="mb-6">
            <h2 className="mb-2 text-ps-lg font-semibold">Premium shift fairness</h2>
            {premium.length === 0 ? (
              <div className="rounded-ps border border-dashed border-ps-border p-4 text-sm text-ps-fg-muted">
                No data.
              </div>
            ) : (
              <div className="overflow-hidden rounded-ps border border-ps-border bg-ps-bg-card">
                <table className="min-w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-ps-border text-left">
                      <th className="px-2 py-2 font-semibold">Staff</th>
                      <th className="px-2 py-2 font-semibold">Premium shifts</th>
                      <th className="px-2 py-2 font-semibold">Total shifts</th>
                      <th className="px-2 py-2 font-semibold">Fairness score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {premium.map((p) => (
                      <tr key={p.userId} className="border-b border-ps-border">
                        <td className="px-2 py-2">
                          {p.userName ?? p.userId}
                          <div className="text-ps-xs text-ps-fg-muted">{p.userId}</div>
                        </td>
                        <td className="px-2 py-2">{p.premiumShiftCount}</td>
                        <td className="px-2 py-2">{p.totalShiftCount}</td>
                        <td className="px-2 py-2">{p.fairnessScore.toFixed(3)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-2 text-ps-lg font-semibold">Desired vs actual hours</h2>
            {desired.length === 0 ? (
              <div className="rounded-ps border border-dashed border-ps-border p-4 text-sm text-ps-fg-muted">
                No data.
              </div>
            ) : (
              <div className="overflow-hidden rounded-ps border border-ps-border bg-ps-bg-card">
                <table className="min-w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-ps-border text-left">
                      <th className="px-2 py-2 font-semibold">Staff</th>
                      <th className="px-2 py-2 font-semibold">Desired weekly hours</th>
                      <th className="px-2 py-2 font-semibold">Actual hours</th>
                      <th className="px-2 py-2 font-semibold">Status</th>
                      <th className="px-2 py-2 font-semibold">Difference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {desired.map((d) => (
                      <tr key={d.userId} className="border-b border-ps-border">
                        <td className="px-2 py-2">
                          {d.userName ?? d.userId}
                          <div className="text-ps-xs text-ps-fg-muted">{d.userId}</div>
                        </td>
                        <td className="px-2 py-2">{d.desiredWeeklyHours.toFixed(1)}h</td>
                        <td className="px-2 py-2">{d.actualHours.toFixed(1)}h</td>
                        <td className="px-2 py-2">
                          <span
                            className={`inline-block rounded-full border px-2.5 py-1 text-ps-xs ${
                              d.status === 'over'
                                ? 'border-rose-500/40 bg-rose-500/10 text-rose-300'
                                : d.status === 'under'
                                ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                                : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                            }`}
                          >
                            {d.status}
                          </span>
                        </td>
                        <td className="px-2 py-2">
                          {d.difference > 0 ? '+' : ''}
                          {d.difference.toFixed(1)}h
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
