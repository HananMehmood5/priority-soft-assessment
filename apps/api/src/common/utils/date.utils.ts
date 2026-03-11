import { DateTime } from 'luxon';

const MS_PER_HOUR = 60 * 60 * 1000;

/**
 * Hours between two dates (fractional).
 */
export function hoursBetween(start: Date, end: Date): number {
  return (end.getTime() - start.getTime()) / MS_PER_HOUR;
}

/**
 * Start of the given date (00:00:00.000) in local time.
 */
export function startOfDay(date: Date): Date {
  return DateTime.fromJSDate(date).startOf('day').toJSDate();
}

/**
 * End of the given date (23:59:59.999) in local time.
 */
export function endOfDay(date: Date): Date {
  return DateTime.fromJSDate(date).endOf('day').toJSDate();
}

/**
 * Add a number of days to a date (preserves time).
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Ordinal day of the year (1–366) for ordering/comparison.
 */
export function toOrdinal(date: Date): number {
  return DateTime.fromJSDate(date).ordinal;
}

/**
 * ISO date string YYYY-MM-DD for the given date.
 */
export function toISODate(date: Date): string {
  return DateTime.fromJSDate(date).toISODate()!;
}

/**
 * Whether a date is in [rangeStart, rangeEnd) (inclusive start, exclusive end).
 */
export function isInRange(date: Date, rangeStart: Date, rangeEnd: Date): boolean {
  const d = DateTime.fromJSDate(date);
  return d >= DateTime.fromJSDate(rangeStart) && d < DateTime.fromJSDate(rangeEnd);
}

/**
 * Get the start of the week for a given date.
 * @param date - The date to resolve.
 * @param weekStartDay - 0=Sunday, 1=Monday (default), ... 6=Saturday.
 */
export function getWeekStart(date: Date, weekStartDay: number): Date {
  const d = DateTime.fromJSDate(date);
  let diff = d.weekday - weekStartDay;
  if (weekStartDay === 0) {
    diff = d.weekday === 0 ? 0 : d.weekday;
  } else {
    if (diff < 0) diff += 7;
  }
  return d.minus({ days: diff }).startOf('day').toJSDate();
}
