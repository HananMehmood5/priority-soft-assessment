'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogPanel } from '@headlessui/react';
import { useQuery, useMutation } from '@apollo/client';
import { useAuth } from '@/lib/auth-context';
import type { NotificationAttributes } from '@/app/types';
import { useSocket } from '@/lib/use-socket';
import {
  NOTIFICATIONS_QUERY,
  MARK_READ_MUTATION,
  MARK_ALL_MUTATION,
} from '@/lib/apollo/operations';
import { BellIcon } from '@/src/components/icons/BellIcon';

type Placement = 'header' | 'sidebar';

function formatDate(value: string | Date): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  return d.toLocaleString();
}

export function NotificationsPanel({ placement = 'header' }: { placement?: Placement }) {
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

  return (
    <>
      <button
        type="button"
        className="relative inline-flex items-center justify-center gap-2 rounded-ps border border-ps-border px-3 py-1.5 text-sm font-medium text-ps-fg transition-colors hover:border-ps-fg-subtle hover:bg-ps-surface-hover disabled:cursor-not-allowed disabled:opacity-60"
        onClick={() => setOpen(true)}
      >
        <BellIcon className="h-4 w-4" />
        <span>Notifications</span>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-ps-primary px-1 text-[0.65rem] text-white">
            {unreadCount}
          </span>
        )}
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-transparent" aria-hidden="true" />
        <div
          className={`fixed max-h-[420px] w-[360px] overflow-auto rounded-ps border border-ps-border bg-ps-bg-card shadow-ps-lg ${
            placement === 'sidebar'
              ? 'left-[15rem] top-20'
              : 'right-6 top-16'
          }`}
        >
          <DialogPanel className="w-full">
          <div className="flex flex-col border-b border-ps-border px-3 pt-3">
            <span className="mb-2 text-ps-sm font-semibold">Notifications</span>
            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex gap-4 text-ps-xs font-medium">
                <button
                  type="button"
                  onClick={() => setUnreadOnly(true)}
                  className={
                    unreadOnly
                      ? 'border-b-2 border-ps-primary pb-1 text-ps-primary'
                      : 'pb-1 text-ps-fg-muted hover:text-ps-fg'
                  }
                >
                  Unread
                </button>
                <button
                  type="button"
                  onClick={() => setUnreadOnly(false)}
                  className={
                    !unreadOnly
                      ? 'border-b-2 border-ps-primary pb-1 text-ps-primary'
                      : 'pb-1 text-ps-fg-muted hover:text-ps-fg'
                  }
                >
                  All
                </button>
              </div>
              <button
                type="button"
                className="text-ps-xs font-medium text-ps-primary hover:underline"
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
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
}
