'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@apollo/client';
import { formatInTimeZone } from 'date-fns-tz';
import { useAuth } from '@/lib/auth-context';
import type { ShiftAttributes, LocationAttributes } from '@/app/types';
import { formatDate, parseCalendarDateInput } from '@/lib/format-date';
import { SHIFTS_WITH_LOCATIONS_QUERY } from '@/lib/apollo/operations';
import { useSocket } from '@/lib/use-socket';
import { expandShiftOccurrencesForCalendar, type CalendarOccurrence } from '@/lib/calendar-location-time';
import { PageHeader } from '@/libs/ui/PageHeader';
import { ErrorState } from '@/libs/ui/ErrorState';
import { PageSkeleton } from '@/libs/ui/PageSkeleton';

const CALENDAR_DESCRIPTION =
  "Week/day shift view with times rendered in each shift's location timezone.";

type ViewMode = 'week' | 'day';

/** Browser-local week column dates as `YYYY-MM-DD` (date picker / calendar week). */
function localWeekColumnIsoDates(anchorYmd: string): string[] {
  const active = parseCalendarDateInput(anchorYmd);
  const start = new Date(active);
  start.setDate(start.getDate() - start.getDay());
  return Array.from({ length: 7 }, (_, idx) => {
    const d = new Date(start);
    d.setDate(start.getDate() + idx);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  });
}

export default function CalendarPage() {
  const { token } = useAuth();
  const socket = useSocket();
  const [view, setView] = useState<ViewMode>('week');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [locationId, setLocationId] = useState('');

  const { data, loading, error, refetch } = useQuery<{
    shifts: ShiftAttributes[];
    locations: LocationAttributes[];
  }>(SHIFTS_WITH_LOCATIONS_QUERY, { skip: !token });

  const shifts = useMemo(() => data?.shifts ?? [], [data?.shifts]);
  const locations = useMemo(() => data?.locations ?? [], [data?.locations]);
  const locationIds = useMemo(() => locations.map((l) => l.id), [locations]);

  const activeDate = useMemo(() => parseCalendarDateInput(date), [date]);

  const occurrences = useMemo<CalendarOccurrence[]>(() => {
    const out: CalendarOccurrence[] = [];
    for (const s of shifts) {
      const tz = locations.find((l) => l.id === s.locationId)?.timezone ?? 'UTC';
      out.push(
        ...expandShiftOccurrencesForCalendar(
          {
            id: s.id,
            locationId: s.locationId,
            startDate: String(s.startDate ?? ''),
            endDate: String(s.endDate ?? ''),
            daysOfWeek: Array.isArray(s.daysOfWeek) ? s.daysOfWeek : [],
            dailyStartTime: String(s.dailyStartTime ?? ''),
            dailyEndTime: String(s.dailyEndTime ?? ''),
            published: !!s.published,
          },
          tz,
        ),
      );
    }
    return out;
  }, [shifts, locations]);

  const filtered = useMemo(() => {
    const selectedLoc = locationId || null;
    let result = occurrences.filter((s) => !selectedLoc || s.locationId === selectedLoc);
    if (view === 'day') {
      result = result.filter((s) => {
        const tz = locations.find((l) => l.id === s.locationId)?.timezone ?? 'UTC';
        return formatInTimeZone(s.startAt, tz, 'yyyy-MM-dd') === date;
      });
      return result;
    }
    const weekCols = new Set(localWeekColumnIsoDates(date));
    result = result.filter((s) => {
      const tz = locations.find((l) => l.id === s.locationId)?.timezone ?? 'UTC';
      return weekCols.has(formatInTimeZone(s.startAt, tz, 'yyyy-MM-dd'));
    });
    return result;
  }, [occurrences, locationId, view, date, locations]);

  const daysForWeekIso = useMemo(() => {
    if (view !== 'week') return [];
    return localWeekColumnIsoDates(date);
  }, [view, date]);

  const locationName = (id: string) =>
    locations.find((l) => l.id === id)?.name ?? id;
  const locationTz = (id: string) =>
    locations.find((l) => l.id === id)?.timezone ?? 'UTC';
  const formatAtLocation = (value: Date, locId: string) =>
    formatInTimeZone(value, locationTz(locId), 'd MMM yyyy, h:mm a zzz');

  useEffect(() => {
    if (!socket) return;

    locationIds.forEach((id) => {
      socket.emit('subscribe_location', { locationId: id });
    });

    const refreshEvents = [
      'schedule_published',
      'schedule_updated',
      'swap_resolved',
      'drop_resolved',
    ];
    const handler = () => refetch();
    refreshEvents.forEach((ev) => socket.on(ev, handler));
    return () => {
      refreshEvents.forEach((ev) => socket.off(ev, handler));
    };
  }, [socket, refetch, locationIds]);

  if (loading) {
    return (
      <div>
        <PageHeader title="Calendar" description={CALENDAR_DESCRIPTION} />
        <PageSkeleton lines={6} />
      </div>
    );
  }
  if (error) {
    return (
      <div>
        <PageHeader title="Calendar" description={CALENDAR_DESCRIPTION} />
        <ErrorState message={error.message} onRetry={() => refetch()} variant="card" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Calendar" description={CALENDAR_DESCRIPTION} className="mb-5" />
      <form
        onSubmit={(e) => e.preventDefault()}
        className="mb-5 flex flex-wrap gap-3"
      >
        <div>
          <label htmlFor="view" className="mb-1 block text-ps-sm">
            View
          </label>
          <select
            id="view"
            value={view}
            onChange={(e) => setView(e.target.value as ViewMode)}
            className="rounded-ps border border-ps-border bg-ps-bg-card px-3 py-2 text-sm text-ps-fg outline-none focus:border-ps-border-focus focus:ring-2 focus:ring-ps-border-focus"
          >
            <option value="week">Week</option>
            <option value="day">Day</option>
          </select>
        </div>
        <div>
          <label htmlFor="date" className="mb-1 block text-ps-sm">
            {view === 'week' ? 'Week of' : 'Day'}
          </label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-ps border border-ps-border bg-ps-bg-card px-3 py-2 text-sm text-ps-fg outline-none focus:border-ps-border-focus focus:ring-2 focus:ring-ps-border-focus"
          />
        </div>
        <div>
          <label htmlFor="locationId" className="mb-1 block text-ps-sm">
            Location (optional)
          </label>
          <select
            id="locationId"
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            className="min-w-[10rem] rounded-ps border border-ps-border bg-ps-bg-card px-3 py-2 text-sm text-ps-fg outline-none focus:border-ps-border-focus focus:ring-2 focus:ring-ps-border-focus"
          >
            <option value="">All locations</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>
      </form>
      {view === 'day' ? (
        <div className="rounded-ps border border-ps-border bg-ps-bg-card p-3">
          <h2 className="mb-2 text-ps-lg font-semibold">
            {formatDate(activeDate)} — {filtered.length} shift(s)
          </h2>
          {filtered.length === 0 ? (
            <p className="text-ps-fg-muted">No shifts on this day.</p>
          ) : (
            <ul className="m-0 list-none p-0">
              {filtered
                .slice()
                .sort((a, b) => +new Date(a.startAt) - +new Date(b.startAt))
                .map((s) => (
                  <li key={s.key} className="border-b border-ps-border py-2">
                    <div className="font-medium">
                      {locationName(s.locationId)} – {formatAtLocation(s.startAt, s.locationId)} –{' '}
                      {formatAtLocation(s.endAt, s.locationId)}
                    </div>
                    <div className="text-ps-xs text-ps-fg-muted">
                      Shift {s.templateId} · {s.published ? 'Published' : 'Draft'}
                    </div>
                  </li>
                ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="-mx-1 overflow-x-auto px-1 pb-2 md:mx-0 md:overflow-visible md:px-0">
          <div className="grid min-w-[640px] grid-cols-7 gap-2 md:min-w-0">
          {daysForWeekIso.map((colIso) => {
            const list = filtered.filter((s) => {
              const tz = locations.find((l) => l.id === s.locationId)?.timezone ?? 'UTC';
              return formatInTimeZone(s.startAt, tz, 'yyyy-MM-dd') === colIso;
            });
            return (
              <div
                key={colIso}
                className="min-h-[80px] rounded-ps border border-ps-border bg-ps-bg-card p-2"
              >
                <div className="mb-1 text-ps-xs font-semibold">
                  {formatDate(parseCalendarDateInput(colIso))}
                </div>
                {list.length === 0 ? (
                  <p className="m-0 text-ps-xs text-ps-fg-muted">No shifts</p>
                ) : (
                  <ul className="m-0 list-none p-0 text-ps-xs">
                    {list
                      .slice()
                      .sort((a, b) => +new Date(a.startAt) - +new Date(b.startAt))
                      .map((s) => (
                        <li key={s.key} className="mb-1">
                          <span className="text-ps-fg-muted">
                            {formatAtLocation(s.startAt, s.locationId)} – {formatAtLocation(s.endAt, s.locationId)}
                          </span>
                          <br />
                          <span>
                            {locationName(s.locationId)} · {s.published ? 'Pub' : 'Draft'}
                          </span>
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            );
          })}
          </div>
        </div>
      )}
    </div>
  );
}
