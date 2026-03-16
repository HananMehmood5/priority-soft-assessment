'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { UserRole } from '@shiftsync/shared';
import { useEffect } from 'react';
import { NotificationsPanel } from './notifications-panel';
import {
  HomeIcon,
  LocationIcon,
  SkillsIcon,
  CalendarIcon,
  MyShiftsIcon,
  RequestIcon,
  DropIcon,
  SwapIcon,
  ShiftsIcon,
  OnDutyIcon,
  FairnessIcon,
  ApprovalsIcon,
  OvertimeIcon,
  AuditIcon,
} from '@/src/components/icons/NavIcons';

const NAV = [
  { href: '/', label: 'Home', Icon: HomeIcon },
  { href: '/locations', label: 'Locations', Icon: LocationIcon },
  { href: '/skills', label: 'Skills', Icon: SkillsIcon },
  { href: '/calendar', label: 'Calendar', Icon: CalendarIcon },
  { href: '/my-shifts', label: 'My shifts', Icon: MyShiftsIcon },
  { href: '/requests', label: 'Requests', Icon: RequestIcon },
  { href: '/drops', label: 'Available drops', Icon: DropIcon },
  { href: '/swaps', label: 'Available swaps', Icon: SwapIcon },
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
        <div className="mb-3">
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
        <div className="mb-4">
          <NotificationsPanel placement="sidebar" />
        </div>
        <nav className="flex flex-col gap-1">
          {NAV.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              className={[
                'flex items-center gap-2 rounded-ps px-3 py-2 text-sm',
                pathname === href
                  ? 'bg-ps-primary-muted font-semibold text-ps-primary'
                  : 'text-ps-fg',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
          {(user?.role === UserRole.Admin || user?.role === UserRole.Manager) && (
            <>
              <Link
                href="/shifts"
                className={[
                  'flex items-center gap-2 rounded-ps px-3 py-2 text-sm',
                  pathname === '/shifts'
                    ? 'bg-ps-primary-muted font-semibold text-ps-primary'
                    : 'text-ps-fg',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <ShiftsIcon className="h-4 w-4" />
                Shifts
              </Link>
              <Link
                href="/on-duty"
                className={[
                  'flex items-center gap-2 rounded-ps px-3 py-2 text-sm',
                  pathname === '/on-duty'
                    ? 'bg-ps-primary-muted font-semibold text-ps-primary'
                    : 'text-ps-fg',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <OnDutyIcon className="h-4 w-4" />
                On-duty
              </Link>
              <Link
                href="/fairness"
                className={[
                  'flex items-center gap-2 rounded-ps px-3 py-2 text-sm',
                  pathname === '/fairness'
                    ? 'bg-ps-primary-muted font-semibold text-ps-primary'
                    : 'text-ps-fg',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <FairnessIcon className="h-4 w-4" />
                Fairness
              </Link>
              <Link
                href="/approvals"
                className={[
                  'flex items-center gap-2 rounded-ps px-3 py-2 text-sm',
                  pathname === '/approvals'
                    ? 'bg-ps-primary-muted font-semibold text-ps-primary'
                    : 'text-ps-fg',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <ApprovalsIcon className="h-4 w-4" />
                Approvals
              </Link>
              <Link
                href="/overtime"
                className={[
                  'flex items-center gap-2 rounded-ps px-3 py-2 text-sm',
                  pathname === '/overtime'
                    ? 'bg-ps-primary-muted font-semibold text-ps-primary'
                    : 'text-ps-fg',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <OvertimeIcon className="h-4 w-4" />
                Overtime
              </Link>
              <Link
                href="/audit"
                className={[
                  'flex items-center gap-2 rounded-ps px-3 py-2 text-sm',
                  pathname === '/audit'
                    ? 'bg-ps-primary-muted font-semibold text-ps-primary'
                    : 'text-ps-fg',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <AuditIcon className="h-4 w-4" />
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
        {children}
      </main>
    </div>
  );
}
