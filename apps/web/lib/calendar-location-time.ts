import { fromZonedTime, formatInTimeZone } from 'date-fns-tz';

/** Add calendar days to a `YYYY-MM-DD` string (ISO date only, no timezone). */
export function addDaysToIsoDate(dayISO: string, delta: number): string {
  const [y, m, d] = dayISO.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  t.setUTCDate(t.getUTCDate() + delta);
  return t.toISOString().slice(0, 10);
}

/** Sunday=0 .. Saturday=6 in `timeZone` for that calendar date (wall noon anchor). */
export function dayOfWeekSun0InTimeZone(dayISO: string, timeZone: string): number {
  const anchor = fromZonedTime(`${dayISO}T12:00:00`, timeZone);
  const isoDow = Number(formatInTimeZone(anchor, timeZone, 'i')); // 1=Mon .. 7=Sun (ISO)
  return isoDow === 7 ? 0 : isoDow;
}

export type CalendarShiftLike = {
  id: string;
  locationId: string;
  startDate: string;
  endDate: string;
  daysOfWeek: number[];
  dailyStartTime: string;
  dailyEndTime: string;
  published: boolean;
};

export type CalendarOccurrence = {
  key: string;
  templateId: string;
  locationId: string;
  /** Calendar day (location-local) when the occurrence starts. */
  dayISO: string;
  startAt: Date;
  endAt: Date;
  published: boolean;
};

/**
 * Expand a template shift into concrete instants. Wall times (date + daily start/end)
 * are interpreted in `locationTimeZone`, then converted to UTC `Date` for sorting/display.
 */
export function expandShiftOccurrencesForCalendar(
  s: CalendarShiftLike,
  locationTimeZone: string,
): CalendarOccurrence[] {
  const startDate = String(s.startDate ?? '').slice(0, 10);
  const endDate = String(s.endDate ?? '').slice(0, 10);
  const dailyStartTime = String(s.dailyStartTime ?? '');
  const dailyEndTime = String(s.dailyEndTime ?? '');
  const daysOfWeek =
    Array.isArray(s.daysOfWeek) && s.daysOfWeek.length ? s.daysOfWeek : [0, 1, 2, 3, 4, 5, 6];

  if (!startDate || !endDate || !dailyStartTime || !dailyEndTime) return [];

  const overnight = dailyEndTime <= dailyStartTime;
  const daysOfWeekSet = new Set<number>(daysOfWeek);
  const out: CalendarOccurrence[] = [];

  for (let dayISO = startDate; dayISO <= endDate; dayISO = addDaysToIsoDate(dayISO, 1)) {
    if (!daysOfWeekSet.has(dayOfWeekSun0InTimeZone(dayISO, locationTimeZone))) continue;

    const endDayISO = overnight ? addDaysToIsoDate(dayISO, 1) : dayISO;
    const startAt = fromZonedTime(`${dayISO}T${dailyStartTime}:00`, locationTimeZone);
    const endAt = fromZonedTime(`${endDayISO}T${dailyEndTime}:00`, locationTimeZone);

    out.push({
      key: `${s.id}:${dayISO}`,
      templateId: s.id,
      locationId: s.locationId,
      dayISO,
      startAt,
      endAt,
      published: !!s.published,
    });
  }

  return out;
}
