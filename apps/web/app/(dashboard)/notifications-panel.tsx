'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useAuth } from '@/lib/auth-context';
import type { NotificationAttributes } from '@/app/types';
import { useSocket } from '@/lib/use-socket';
import {
  NOTIFICATIONS_QUERY,
  MARK_READ_MUTATION,
  MARK_ALL_MUTATION,
} from '@/lib/apollo/operations';

function formatDate(value: string | Date): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  return d.toLocaleString();
}

export function NotificationsPanel() {
  const { token } = useAuth();
  const socket = useSocket();
  const [open, setOpen] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false);

  const { data, loading, error, refetch } = useQuery<{
    notifications: NotificationAttributes[];
  }>(NOTIFICATIONS_QUERY, {
    variables: { unreadOnly, limit: 20, offset: 0 },
    skip: !token,
  });

  const [markRead] = useMutation(MARK_READ_MUTATION, {
    refetchQueries: [
      { query: NOTIFICATIONS_QUERY, variables: { unreadOnly, limit: 20, offset: 0 } },
    ],
  });
  const [markAllRead] = useMutation(MARK_ALL_MUTATION, {
    refetchQueries: [
      { query: NOTIFICATIONS_QUERY, variables: { unreadOnly, limit: 20, offset: 0 } },
    ],
  });

  const items = data?.notifications ?? [];
  const unreadCount = items.filter((n) => !n.read).length;

  useEffect(() => {
    if (!socket) return;
    const handler = () => refetch();
    socket.on('notification', handler);
    return () => {
      socket.off('notification', handler);
    };
  }, [socket, refetch]);

  const handleMarkRead = async (id: string) => {
    if (!token) return;
    try {
      await markRead({ variables: { id } });
    } catch {
      // ignore
    }
  };

  const handleMarkAll = async () => {
    if (!token) return;
    try {
      await markAllRead();
    } catch {
      // ignore
    }
  };

  const btnSecondary =
    'inline-flex items-center justify-center rounded-ps border border-ps-border px-4 py-2 text-sm font-medium text-ps-fg transition-colors hover:border-ps-fg-subtle hover:bg-ps-surface-hover disabled:cursor-not-allowed disabled:opacity-60';

  return (
    <div className="relative">
      <button
        type="button"
        className={`${btnSecondary} relative`}
        onClick={() => setOpen((v) => !v)}
      >
        Notifications
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-ps-primary px-1 text-[0.65rem] text-white">
            {unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 max-h-[420px] w-[360px] overflow-auto rounded-ps border border-ps-border bg-ps-bg-card shadow-ps-lg">
          <div className="flex items-center justify-between gap-2 border-b border-ps-border p-3">
            <span className="text-ps-sm font-semibold">Notifications</span>
            <div className="flex gap-2">
              <button
                type="button"
                className={`${btnSecondary} px-2 py-0.5 text-ps-xs`}
                onClick={() => setUnreadOnly(true)}
              >
                Unread
              </button>
              <button
                type="button"
                className={`${btnSecondary} px-2 py-0.5 text-ps-xs`}
                onClick={() => setUnreadOnly(false)}
              >
                All
              </button>
              <button
                type="button"
                className={`${btnSecondary} px-2 py-0.5 text-ps-xs`}
                onClick={handleMarkAll}
              >
                Mark all read
              </button>
            </div>
          </div>
          {loading && <p className="p-3 text-ps-fg-muted">Loading…</p>}
          {error && <p className="p-3 text-ps-error">{error.message}</p>}
          {!loading && !error && items.length === 0 && (
            <p className="p-3 text-ps-fg-muted">No notifications.</p>
          )}
          <div className="p-2">
            {items.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => !n.read && handleMarkRead(n.id)}
                className={`mb-1 block w-full cursor-pointer rounded-ps px-2 py-2 text-left transition-colors ${
                  n.read ? 'bg-transparent' : 'bg-ps-primary-muted'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className={`text-ps-sm ${n.read ? 'font-normal' : 'font-semibold'}`}>
                      {n.title ?? n.type}
                    </div>
                    {n.body && (
                      <div className="text-ps-xs text-ps-fg-muted">{n.body}</div>
                    )}
                  </div>
                  <div className="whitespace-nowrap text-ps-xs text-ps-fg-muted">
                    {formatDate(n.createdAt as unknown as string)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
