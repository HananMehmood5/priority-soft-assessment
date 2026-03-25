'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@apollo/client';
import { useAuth } from '@/lib/auth-context';
import type { LocationAttributes, ShiftAssignmentAttributes, ShiftAttributes } from '@/app/types';
import { UserRole } from '@shiftsync/shared';
import { useSocket } from '@/lib/use-socket';
import { LOCATIONS_QUERY, ON_DUTY_QUERY } from '@/lib/apollo/operations';

type AssignmentWithUser = ShiftAssignmentAttributes & {
  user?: {
    id: string;
    name?: string | null;
    email?: string;
  } | null;
};

type ShiftWithAssignments = ShiftAttributes & {
  location?: Pick<LocationAttributes, 'id' | 'name' | 'timezone'> | null;
  assignments?: AssignmentWithUser[];
};

type OnDutyQueryResult = {
  onDutyShifts: ShiftWithAssignments[];
};

type LocationsQueryResult = {
  locations: Pick<LocationAttributes, 'id' | 'name' | 'timezone'>[];
};

function formatTime(time: string): string {
  const [hoursPart, minutesPart] = time.split(':');
  const hours = Number(hoursPart);
  const minutes = Number(minutesPart);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return time;
  const hour12 = hours % 12 || 12;
  const suffix = hours >= 12 ? 'PM' : 'AM';
  return `${hour12}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

function formatDateRange(startDate: string, endDate: string): string {
  const startParts = startDate.split('-').map((part) => Number(part));
  const endParts = endDate.split('-').map((part) => Number(part));
  if (
    startParts.length !== 3 ||
    endParts.length !== 3 ||
    startParts.some(Number.isNaN) ||
    endParts.some(Number.isNaN)
  ) {
    return `${startDate} - ${endDate}`;
  }

  const [startYear, startMonth, startDay] = startParts;
  const [endYear, endMonth, endDay] = endParts;
  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const startMonthLabel = monthLabels[startMonth - 1];
  const endMonthLabel = monthLabels[endMonth - 1];
  if (!startMonthLabel || !endMonthLabel) {
    return `${startDate} - ${endDate}`;
  }

  const formatMonthDay = (monthLabel: string, day: number) => `${monthLabel} ${day}`;
  const formatFull = (monthLabel: string, day: number, year: number) => `${monthLabel} ${day}, ${year}`;

  return startDate === endDate
    ? formatFull(startMonthLabel, startDay, startYear)
    : `${formatMonthDay(startMonthLabel, startDay)} - ${formatFull(endMonthLabel, endDay, endYear)}`;
}

function formatAssignee(assignment: AssignmentWithUser): string {
  const name = assignment.user?.name?.trim();
  if (name) return name;
  const email = assignment.user?.email?.trim();
  if (email) return email;
  if (assignment.userId.length <= 8) return assignment.userId;
  return `User ${assignment.userId.slice(0, 8)}`;
}

export default function OnDutyPage() {
  const { token, user } = useAuth();
  const socket = useSocket();
  const [locationId, setLocationId] = useState('');

  const canAccess =
    user?.role === UserRole.Admin || user?.role === UserRole.Manager;

  const { data, loading, error, refetch } = useQuery<OnDutyQueryResult>(ON_DUTY_QUERY, {
    variables: { locationId: locationId || null },
    skip: !token || !canAccess,
  });

  const {
    data: locationsData,
    loading: locationsLoading,
    error: locationsError,
  } = useQuery<LocationsQueryResult>(LOCATIONS_QUERY, {
    skip: !token || !canAccess,
  });

  const shifts = data?.onDutyShifts ?? [];
  const locations = locationsData?.locations ?? [];
  const isLoading = loading || locationsLoading;
  const queryError = error ?? locationsError;

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

  if (!user) return <p className="text-ps-fg-muted">Loading…</p>;
  if (!canAccess) {
    return <p className="text-ps-error">You do not have access to the on-duty dashboard.</p>;
  }

  const grouped = shifts.reduce<Record<string, ShiftWithAssignments[]>>((acc, shift) => {
    const key = shift.locationId;
    acc[key] = acc[key] || [];
    acc[key].push(shift);
    return acc;
  }, {});

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">On-duty dashboard</h1>
      <p className="mb-5 text-ps-fg-muted">
        Who is currently on duty, by location. Updates automatically as the schedule changes.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          refetch();
        }}
        className="mb-6 flex flex-col gap-3 rounded-ps border border-ps-border bg-ps-bg-card p-4 sm:flex-row sm:items-end"
      >
        <div className="min-w-0 flex-1">
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
        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center justify-center rounded-ps bg-ps-primary px-4 py-2 text-sm font-semibold text-ps-primary-foreground shadow-ps transition-colors hover:bg-ps-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
      </form>

      {queryError && (
        <p className="mb-4 rounded-ps border border-ps-error bg-ps-error/10 p-3 text-sm text-ps-error">
          {queryError.message}
        </p>
      )}

      {isLoading ? (
        <p className="text-ps-fg-muted">Loading…</p>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="rounded-ps border border-dashed border-ps-border p-6 text-center text-ps-fg-muted">
          No one is currently on duty for the selected location.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {Object.entries(grouped).map(([locId, list]) => (
            <div key={locId} className="rounded-ps border border-ps-border bg-ps-bg-card p-4">
              <h2 className="text-ps-lg font-semibold">
                {list[0]?.location?.name ||
                  locations.find((location) => location.id === locId)?.name ||
                  `Location ${locId.slice(0, 8)}`}
              </h2>
              <p className="mb-3 text-xs text-ps-fg-muted">
                {list[0]?.location?.timezone
                  ? `Timezone: ${list[0].location.timezone}`
                  : `Location ID: ${locId}`}
              </p>

              <div className="space-y-3">
                {list.map((shift) => (
                  <article key={shift.id} className="rounded-ps border border-ps-border bg-ps-bg p-3">
                    <div className="grid gap-3 md:grid-cols-[2fr_2fr_3fr]">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-ps-fg-muted">Shift</p>
                        <p className="mt-1 text-sm font-medium text-ps-fg">
                          {shift.id.length <= 8 ? shift.id : `#${shift.id.slice(0, 8)}`}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-ps-fg-muted">Schedule</p>
                        <p className="mt-1 text-sm text-ps-fg">
                          {formatTime(shift.dailyStartTime)} - {formatTime(shift.dailyEndTime)}
                        </p>
                        <p className="text-xs text-ps-fg-muted">
                          {formatDateRange(shift.startDate, shift.endDate)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-ps-fg-muted">
                          Assigned team
                        </p>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {shift.assignments && shift.assignments.length > 0 ? (
                            shift.assignments.map((assignment) => (
                              <span
                                key={assignment.id}
                                className="rounded-full border border-ps-border px-2 py-1 text-xs text-ps-fg"
                              >
                                {formatAssignee(assignment)}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-ps-fg-muted">Unassigned</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
