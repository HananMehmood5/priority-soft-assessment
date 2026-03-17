'use client';

import { format, formatDistanceToNow } from 'date-fns';

export function formatDateTime(value: string | Date): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  // Example: 17 Mar 2026, 10:50 AM
  return format(d, 'd MMM yyyy, h:mm a');
}

export function formatDate(value: string | Date): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  // Example: 17 Mar 2026
  return format(d, 'd MMM yyyy');
}

export function formatRelativeDateTime(value: string | Date): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  return formatDistanceToNow(d, { addSuffix: true });
}

