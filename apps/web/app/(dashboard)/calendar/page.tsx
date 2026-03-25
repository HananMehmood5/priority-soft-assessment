'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@apollo/client';
import { useAuth } from '@/lib/auth-context';
import type { ShiftAttributes, LocationAttributes } from '@/app/types';
import { formatDateTime, formatDate, parseCalendarDateInput } from '@/lib/format-date';
import { SHIFTS_WITH_LOCATIONS_QUERY } from '@/lib/apollo/operations';

type ViewMode = 'week' | 'day';

export default function CalendarPage() {
  const { token } = useAuth();
  const [view, setView] = useState<ViewMode>('week');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [locationId, setLocationId] = useState('');

  const { data, loading, error } = useQuery<{
    shifts: ShiftAttributes[];
    locations: LocationAttributes[];
  }>(SHIFTS_WITH_LOCATIONS_QUERY, { skip: !token });

  const shifts = useMemo(() => data?.shifts ?? [], [data?.shifts]);
  const locations = useMemo(() => data?.locations ?? [], [data?.locations]);

  const activeDate = useMemo(() => parseCalendarDateInput(date), [date]);

  type ShiftOccurrence = {
    key: string;
    templateId: string;
    locationId: string;
    startAt: Date;
    endAt: Date;
    published: boolean;
  };

  const occurrences = useMemo<ShiftOccurrence[]>(() => {
    const out: ShiftOccurrence[] = [];
    for (const s of shifts as any[]) {
      const startDate = String(s.startDate ?? '').slice(0, 10);
      const endDate = String(s.endDate ?? '').slice(0, 10);
      const dailyStartTime = String(s.dailyStartTime ?? '');
      const dailyEndTime = String(s.dailyEndTime ?? '');
      const daysOfWeek = Array.isArray(s.daysOfWeek) && s.daysOfWeek.length ? s.daysOfWeek : [0, 1, 2, 3, 4, 5, 6];
      if (!startDate || !endDate || !dailyStartTime || !dailyEndTime) continue;

      const overnight = dailyEndTime <= dailyStartTime;
      const daysOfWeekSet = new Set<number>(daysOfWeek);
      const cursor = new Date(`${startDate}T00:00:00`);
      const end = new Date(`${endDate}T00:00:00`);
      while (cursor <= end) {
        const weekdayLocal = cursor.getDay(); // 0=Sun..6=Sat (local, matches template days)
        if (!daysOfWeekSet.has(weekdayLocal)) {
          cursor.setDate(cursor.getDate() + 1);
          continue;
        }
        const dayISO = cursor.toISOString().slice(0, 10);
        const startAt = new Date(`${dayISO}T${dailyStartTime}:00`);
        const endAt = new Date(`${dayISO}T${dailyEndTime}:00`);
        if (overnight) endAt.setDate(endAt.getDate() + 1);
        out.push({
          key: `${s.id}:${dayISO}`,
          templateId: s.id,
          locationId: s.locationId,
          startAt,
          endAt,
          published: !!s.published,
        });
        cursor.setDate(cursor.getDate() + 1);
      }
    }
    return out;
  }, [shifts]);

  const filtered = useMemo(() => {
    const selectedLoc = locationId || null;
    const result = occurrences.filter((s) => !selectedLoc || s.locationId === selectedLoc);
    if (view === 'day') {
      return result.filter((s) => {
        const d = new Date(s.startAt);
        return d.toDateString() === activeDate.toDateString();
      });
    }
    const start = new Date(activeDate);
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return result.filter((s) => {
      const d = new Date(s.startAt);
      return d >= start && d < end;
    });
  }, [occurrences, locationId, view, activeDate]);

  const daysForWeek = useMemo(() => {
    if (view !== 'week') return [];
    const start = new Date(activeDate);
    start.setDate(start.getDate() - start.getDay());
    return Array.from({ length: 7 }).map((_, idx) => {
      const d = new Date(start);
      d.setDate(start.getDate() + idx);
      return d;
    });
  }, [view, activeDate]);

  const locationName = (id: string) =>
    locations.find((l) => l.id === id)?.name ?? id;

  if (loading) return <p className="text-ps-fg-muted">Loading calendar…</p>;
  if (error) return <p className="text-ps-error">{error.message}</p>;

  return (
    <div>
      <h1 className="mb-3 text-2xl font-bold">Calendar</h1>
      <p className="mb-4 text-ps-fg-muted">
        Simple week/day view of shifts. All times are shown in your browser&apos;s local timezone;
        each shift includes its location ID.
      </p>
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
          <input
            id="locationId"
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            placeholder="Filter by location ID…"
            className="rounded-ps border border-ps-border bg-ps-bg-card px-3 py-2 text-sm text-ps-fg outline-none focus:border-ps-border-focus focus:ring-2 focus:ring-ps-border-focus"
          />
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
                      {locationName(s.locationId)} – {formatDateTime(s.startAt)} –{' '}
                      {formatDateTime(s.endAt)}
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
        <div className="grid grid-cols-7 gap-2">
          {daysForWeek.map((d) => {
            const list = filtered.filter(
              (s) => new Date(s.startAt).toDateString() === d.toDateString()
            );
            return (
              <div
                key={d.toISOString()}
                className="min-h-[80px] rounded-ps border border-ps-border bg-ps-bg-card p-2"
              >
                <div className="mb-1 text-ps-xs font-semibold">
                  {d.toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
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
                            {formatDateTime(s.startAt)} – {formatDateTime(s.endAt)}
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
      )}
    </div>
  );
}
