'use client';

import { format, formatDistanceToNow } from 'date-fns';

export function formatDateTime(value: string | Date): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  return format(d, 'M/d/yyyy, h:mm:ss a');
}

export function formatDate(value: string | Date): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  return format(d, 'M/d/yyyy');
}

export function formatRelativeDateTime(value: string | Date): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  return formatDistanceToNow(d, { addSuffix: true });
}

