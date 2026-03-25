'use client';

import { useEffect, useState } from 'react';
import {
  Popover,
  PopoverButton,
  PopoverPanel,
  TabGroup,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
} from '@headlessui/react';
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

const tabClass = ({ selected }: { selected: boolean }) =>
  [
    'rounded-none border-0 bg-transparent px-0 py-1 text-ps-xs font-medium outline-none focus:outline-none',
    selected
      ? 'border-b-2 border-ps-primary text-ps-primary'
      : 'border-b-2 border-transparent text-ps-fg-muted hover:text-ps-fg',
  ].join(' ');

export function NotificationsPanel({ placement = 'header' }: { placement?: Placement }) {
  const { token } = useAuth();
  const socket = useSocket();
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

  const listSection = (
    <>
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
    </>
  );

  return (
    <Popover className="relative">
      <PopoverButton
        type="button"
        disabled={!token}
        className="relative inline-flex items-center justify-center gap-2 rounded-ps border border-ps-border px-3 py-1.5 text-sm font-medium text-ps-fg transition-colors hover:border-ps-fg-subtle hover:bg-ps-surface-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        <BellIcon className="h-4 w-4" />
        <span>Notifications</span>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-ps-primary px-1 text-[0.65rem] text-white">
            {unreadCount}
          </span>
        )}
      </PopoverButton>

      <PopoverPanel
        id="notifications-popover"
        anchor={
          placement === 'sidebar'
            ? { to: 'right start', gap: '0.5rem' }
            : { to: 'bottom end', gap: '0.5rem' }
        }
        transition
        className="z-[60] max-h-[min(420px,70vh)] w-[min(360px,calc(100vw-1rem))] overflow-auto rounded-ps border border-ps-border bg-ps-bg-card shadow-ps-lg data-[closed]:scale-95 data-[closed]:opacity-0 data-[enter]:duration-150 data-[leave]:duration-100"
      >
        <div className="flex flex-col border-b border-ps-border px-3 pt-3">
          <span className="mb-2 text-ps-sm font-semibold">Notifications</span>
          <TabGroup
            selectedIndex={unreadOnly ? 0 : 1}
            onChange={(index) => setUnreadOnly(index === 0)}
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <TabList className="flex gap-4">
                <Tab className={tabClass}>Unread</Tab>
                <Tab className={tabClass}>All</Tab>
              </TabList>
              <button
                type="button"
                className="shrink-0 text-ps-xs font-medium text-ps-primary hover:underline"
                onClick={handleMarkAll}
              >
                Mark all read
              </button>
            </div>
            <TabPanels>
              <TabPanel>{listSection}</TabPanel>
              <TabPanel>{listSection}</TabPanel>
            </TabPanels>
          </TabGroup>
        </div>
      </PopoverPanel>
    </Popover>
  );
}
