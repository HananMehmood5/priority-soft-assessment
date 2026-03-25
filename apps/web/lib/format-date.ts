'use client';

import { format, formatDistanceToNow } from 'date-fns';

/** Parse `YYYY-MM-DD` as a local calendar date (avoids UTC drift from `new Date('YYYY-MM-DD')`). */
export function parseCalendarDateInput(value: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!m) return new Date(value);
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  return new Date(y, mo - 1, d);
}

function toDate(value: string | Date): Date {
  if (value instanceof Date) return value;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    return parseCalendarDateInput(value);
  }
  return new Date(value);
}

export function formatDateTime(value: string | Date): string {
  const d = toDate(value);
  // Example: 17 Mar 2026, 10:50 AM
  return format(d, 'd MMM yyyy, h:mm a');
}

export function formatDate(value: string | Date): string {
  const d = toDate(value);
  // Example: 17 Mar 2026
  return format(d, 'd MMM yyyy');
}

export function formatRelativeDateTime(value: string | Date): string {
  const d = toDate(value);
  return formatDistanceToNow(d, { addSuffix: true });
}

