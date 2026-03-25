'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@apollo/client';
import { useAuth } from '@/lib/auth-context';
import type { ShiftAttributes, ShiftAssignmentAttributes } from '@/app/types';
import { UserRole } from '@shiftsync/shared';
import { useSocket } from '@/lib/use-socket';
import { ON_DUTY_QUERY } from '@/lib/apollo/operations';

type ShiftWithAssignments = ShiftAttributes & {
  assignments?: ShiftAssignmentAttributes[];
};

export default function OnDutyPage() {
  const { token, user } = useAuth();
  const socket = useSocket();
  const [locationId, setLocationId] = useState('');

  const { data, loading, error, refetch } = useQuery<{
    onDutyShifts: ShiftWithAssignments[];
  }>(ON_DUTY_QUERY, {
    variables: { locationId: locationId || null },
    skip: !token,
  });

  const shifts = data?.onDutyShifts ?? [];

  useEffect(() => {
    if (!socket) return;
    const refreshEvents = [
      'schedule_published',
      'schedule_updated',
      'swap_resolved',
      'drop_resolved',
      'assignment_conflict',
    ];
    const handler = () => refetch();
    refreshEvents.forEach((ev) => socket.on(ev, handler));
    return () => {
      refreshEvents.forEach((ev) => socket.off(ev, handler));
    };
  }, [socket, refetch]);

  if (!user || (user.role !== UserRole.Admin && user.role !== UserRole.Manager)) {
    return <p className="text-ps-error">You do not have access to the on-duty dashboard.</p>;
  }

  const grouped = shifts.reduce<Record<string, ShiftWithAssignments[]>>((acc, s) => {
    const key = s.locationId;
    acc[key] = acc[key] || [];
    acc[key].push(s);
    return acc;
  }, {});

  return (
    <div>
      <h1 className="mb-3 text-2xl font-bold">On-duty dashboard</h1>
      <p className="mb-4 text-ps-fg-muted">
        Who is currently on duty, by location. Updates automatically as the schedule changes.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          refetch();
        }}
        className="mb-5 flex flex-wrap gap-3"
      >
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
            disabled={loading}
            className="inline-flex items-center justify-center rounded-ps bg-ps-primary px-4 py-2 text-sm font-semibold text-ps-primary-foreground shadow-ps transition-colors hover:bg-ps-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
      </form>
      {error && <p className="mb-3 text-ps-error">{error.message}</p>}
      {loading ? (
        <p className="text-ps-fg-muted">Loading…</p>
      ) : Object.keys(grouped).length === 0 ? (
        <p className="text-ps-fg-muted">No one is currently on duty.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {Object.entries(grouped).map(([locId, list]) => (
            <div
              key={locId}
              className="rounded-ps border border-ps-border bg-ps-bg-card p-4"
            >
              <h2 className="mb-2 text-ps-lg font-semibold">Location {locId}</h2>
              <table className="min-w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-ps-border text-left">
                    <th className="px-2 py-2 font-semibold">Shift</th>
                    <th className="px-2 py-2 font-semibold">Time</th>
                    <th className="px-2 py-2 font-semibold">Assignments</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((s) => (
                    <tr key={s.id} className="border-b border-ps-border">
                      <td className="px-2 py-2">{s.id}</td>
                      <td className="px-2 py-2">
                        {s.dailyStartTime}–{s.dailyEndTime} from {s.startDate} to {s.endDate}
                      </td>
                      <td className="px-2 py-2 text-ps-xs text-ps-fg-muted">
                        {s.assignments && s.assignments.length > 0
                          ? s.assignments.map((a) => a.userId).join(', ')
                          : 'Unassigned'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
