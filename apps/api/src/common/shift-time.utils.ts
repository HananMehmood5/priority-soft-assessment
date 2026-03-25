import { addDays, format, getISODay, parseISO } from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';
import { addDays as addDaysUtc } from './utils/date.utils';

export type ShiftTemplateLike = {
  startDate: string | Date;
  endDate: string | Date;
  /** Weekdays the shift occurs on within the template range (0=Sun..6=Sat). */
  daysOfWeek?: number[];
  dailyStartTime: string;
  dailyEndTime: string;
};

export type ShiftInterval = { start: Date; end: Date };

function toISODateOnly(d: string | Date): string {
  if (typeof d === 'string') return d.slice(0, 10);
  return d.toISOString().slice(0, 10);
}

function isValidTimeHHmm(t: string): boolean {
  return /^\d{2}:\d{2}$/.test(t);
}

function combineUtc(dateISO: string, timeHHmm: string): Date {
  // Note: this treats date/time as UTC for simplicity (legacy / tests).
  return new Date(`${dateISO}T${timeHHmm}:00Z`);
}

/** ISO weekday (Mon=1..Sun=7) to JS weekday (Sun=0..Sat=6). */
function isoWeekdayToJs(isoDow: number): number {
  return isoDow === 7 ? 0 : isoDow;
}

function eachCalendarDayBetween(startISO: string, endISO: string): string[] {
  const days: string[] = [];
  let cur = parseISO(startISO);
  const end = parseISO(endISO);
  while (cur <= end) {
    days.push(format(cur, 'yyyy-MM-dd'));
    cur = addDays(cur, 1);
  }
  return days;
}

/**
 * Expand a shift template into concrete UTC instants.
 * When `ianaTimeZone` is set, `dailyStartTime` / `dailyEndTime` are interpreted in that zone (IANA name).
 * When omitted, uses the legacy UTC calendar-day behavior (preserves existing unit tests).
 */
export function expandShiftToIntervals(
  shift: ShiftTemplateLike,
  range?: { start: Date; end: Date },
  ianaTimeZone?: string,
): ShiftInterval[] {
  const startDate = toISODateOnly(shift.startDate);
  const endDate = toISODateOnly(shift.endDate);
  const { dailyStartTime, dailyEndTime } = shift;
  const daysOfWeek = shift.daysOfWeek?.length ? new Set(shift.daysOfWeek) : null;

  if (!isValidTimeHHmm(dailyStartTime) || !isValidTimeHHmm(dailyEndTime)) return [];
  if (startDate > endDate) return [];

  const intervals: ShiftInterval[] = [];
  const overnight = dailyEndTime <= dailyStartTime;

  if (ianaTimeZone) {
    for (const dayStr of eachCalendarDayBetween(startDate, endDate)) {
      const anchor = fromZonedTime(`${dayStr}T12:00:00`, ianaTimeZone);
      const jsDow = isoWeekdayToJs(getISODay(anchor));
      if (daysOfWeek && !daysOfWeek.has(jsDow)) continue;

      const endDayStr = overnight
        ? format(addDays(parseISO(dayStr), 1), 'yyyy-MM-dd')
        : dayStr;
      const start = fromZonedTime(`${dayStr}T${dailyStartTime}:00`, ianaTimeZone);
      const endDt = fromZonedTime(`${endDayStr}T${dailyEndTime}:00`, ianaTimeZone);
      if (start < endDt) {
        if (!range || (start < range.end && endDt > range.start)) {
          intervals.push({ start, end: endDt });
        }
      }
    }
    return intervals;
  }

  let cursor = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);

  while (cursor.getTime() <= end.getTime()) {
    const weekdayUtc = cursor.getUTCDay(); // 0=Sun..6=Sat
    if (daysOfWeek && !daysOfWeek.has(weekdayUtc)) {
      cursor = addDaysUtc(cursor, 1);
      continue;
    }

    const dayISO = cursor.toISOString().slice(0, 10);
    const nextDayISO = addDaysUtc(new Date(cursor), 1).toISOString().slice(0, 10);
    const start = combineUtc(dayISO, dailyStartTime);
    const endDt = combineUtc(overnight ? nextDayISO : dayISO, dailyEndTime);
    if (start < endDt) {
      if (!range || (start < range.end && endDt > range.start)) {
        intervals.push({ start, end: endDt });
      }
    }
    cursor = addDaysUtc(cursor, 1);
  }
  return intervals;
}

export function getShiftFirstStart(shift: ShiftTemplateLike, ianaTimeZone?: string): Date | null {
  const intervals = expandShiftToIntervals(shift, undefined, ianaTimeZone);
  return intervals.length ? intervals[0].start : null;
}

/** Read IANA timezone from a shift that may include Sequelize `location` association. */
export function getShiftTimeZone(shift: ShiftTemplateLike & { location?: { timezone?: string } }): string | undefined {
  const tz = (shift as { location?: { timezone?: string } }).location?.timezone;
  return tz || undefined;
}

