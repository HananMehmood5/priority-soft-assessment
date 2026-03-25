import { addDays } from './utils/date.utils';

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
  // Note: this treats date/time as UTC for simplicity.
  return new Date(`${dateISO}T${timeHHmm}:00Z`);
}

export function expandShiftToIntervals(
  shift: ShiftTemplateLike,
  range?: { start: Date; end: Date },
): ShiftInterval[] {
  const startDate = toISODateOnly(shift.startDate);
  const endDate = toISODateOnly(shift.endDate);
  const { dailyStartTime, dailyEndTime } = shift;
  const daysOfWeek = shift.daysOfWeek?.length ? new Set(shift.daysOfWeek) : null;

  if (!isValidTimeHHmm(dailyStartTime) || !isValidTimeHHmm(dailyEndTime)) return [];
  if (startDate > endDate) return [];

  const intervals: ShiftInterval[] = [];
  let cursor = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  const overnight = dailyEndTime <= dailyStartTime;

  while (cursor.getTime() <= end.getTime()) {
    const weekdayUtc = cursor.getUTCDay(); // 0=Sun..6=Sat
    if (daysOfWeek && !daysOfWeek.has(weekdayUtc)) {
      cursor = addDays(cursor, 1);
      continue;
    }

    const dayISO = cursor.toISOString().slice(0, 10);
    const nextDayISO = addDays(new Date(cursor), 1).toISOString().slice(0, 10);
    const start = combineUtc(dayISO, dailyStartTime);
    const endDt = combineUtc(overnight ? nextDayISO : dayISO, dailyEndTime);
    if (start < endDt) {
      if (!range || (start < range.end && endDt > range.start)) {
        intervals.push({ start, end: endDt });
      }
    }
    cursor = addDays(cursor, 1);
  }
  return intervals;
}

export function getShiftFirstStart(shift: ShiftTemplateLike): Date | null {
  const intervals = expandShiftToIntervals(shift);
  return intervals.length ? intervals[0].start : null;
}

