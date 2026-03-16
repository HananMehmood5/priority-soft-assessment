'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { UserRole } from '@shiftsync/shared';
import { useEffect } from 'react';
import { NotificationsPanel } from './notifications-panel';

const NAV = [
  { href: '/', label: 'Home' },
  { href: '/locations', label: 'Locations' },
  { href: '/skills', label: 'Skills' },
  { href: '/calendar', label: 'Calendar' },
  { href: '/my-shifts', label: 'My shifts' },
  { href: '/requests', label: 'Requests' },
  { href: '/drops', label: 'Available drops' },
  { href: '/swaps', label: 'Available swaps' },
] as const;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { token, user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!token) {
      router.replace('/login');
      return;
    }
  }, [loading, token, router]);

  if (loading) {
    return (
      <main className="min-h-screen p-6">
        <p className="text-ps-fg-muted">Loading…</p>
      </main>
    );
  }

  if (!token) {
    return null;
  }

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 flex-col gap-4 border-r border-ps-border bg-ps-bg-card p-6">
        <div className="mb-4">
          <Link href="/" className="inline-flex items-center gap-3">
            <Image
              src="/priority-soft-logo.png"
              alt="Priority Soft"
              width={160}
              height={32}
              className="h-8 w-auto"
              priority
            />
          </Link>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={[
                'rounded-ps px-3 py-2 text-sm',
                pathname === href
                  ? 'bg-ps-primary-muted font-semibold text-ps-primary'
                  : 'text-ps-fg',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {label}
            </Link>
          ))}
          {(user?.role === UserRole.Admin || user?.role === UserRole.Manager) && (
            <>
              <Link
                href="/shifts"
                className={[
                  'rounded-ps px-3 py-2 text-sm',
                  pathname === '/shifts'
                    ? 'bg-ps-primary-muted font-semibold text-ps-primary'
                    : 'text-ps-fg',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                Shifts
              </Link>
              <Link
                href="/on-duty"
                className={[
                  'rounded-ps px-3 py-2 text-sm',
                  pathname === '/on-duty'
                    ? 'bg-ps-primary-muted font-semibold text-ps-primary'
                    : 'text-ps-fg',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                On-duty
              </Link>
              <Link
                href="/fairness"
                className={[
                  'rounded-ps px-3 py-2 text-sm',
                  pathname === '/fairness'
                    ? 'bg-ps-primary-muted font-semibold text-ps-primary'
                    : 'text-ps-fg',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                Fairness
              </Link>
              <Link
                href="/approvals"
                className={[
                  'rounded-ps px-3 py-2 text-sm',
                  pathname === '/approvals'
                    ? 'bg-ps-primary-muted font-semibold text-ps-primary'
                    : 'text-ps-fg',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                Approvals
              </Link>
              <Link
                href="/overtime"
                className={[
                  'rounded-ps px-3 py-2 text-sm',
                  pathname === '/overtime'
                    ? 'bg-ps-primary-muted font-semibold text-ps-primary'
                    : 'text-ps-fg',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                Overtime
              </Link>
              <Link
                href="/audit"
                className={[
                  'rounded-ps px-3 py-2 text-sm',
                  pathname === '/audit'
                    ? 'bg-ps-primary-muted font-semibold text-ps-primary'
                    : 'text-ps-fg',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                Audit
              </Link>
            </>
          )}
        </nav>
        <div className="mt-auto border-t border-ps-border pt-6">
          <p className="mb-1 text-ps-sm text-ps-fg-muted">
            {user?.email}
          </p>
          <p className="mb-3 text-ps-sm">
            {user?.name ?? '—'} · {user?.role}
          </p>
          <Link
            href="/profile"
            className="mb-2 inline-block text-ps-xs text-ps-primary"
          >
            View profile
          </Link>
          <button
            type="button"
            onClick={logout}
            className="inline-flex w-full items-center justify-center rounded-ps border border-ps-border px-3 py-2 text-sm font-medium text-ps-fg transition-colors hover:border-ps-fg-subtle hover:bg-ps-surface-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 bg-ps-bg p-6">
        <div className="mb-4 flex justify-end">
          <NotificationsPanel />
        </div>
        {children}
      </main>
    </div>
  );
}
