'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useCanAccessManagerNav } from '@/lib/hooks/use-role';
import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from '@headlessui/react';
import { NotificationsPanel } from './notifications-panel';
import { MenuIcon, CloseIcon } from '@/src/components/icons/NavIcons';
import {
  EMPLOYEE_NAV_SECTIONS,
  MANAGER_NAV_SECTION,
  type NavSection,
} from './dashboard-nav-config';
import { DashboardNavLinks } from './DashboardNavLinks';
import { Button } from '@/libs/ui/Button';

function buildNavSections(showManager: boolean): NavSection[] {
  const sections = [...EMPLOYEE_NAV_SECTIONS];
  if (showManager) {
    sections.push(MANAGER_NAV_SECTION);
  }
  return sections;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { token, user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [navOpen, setNavOpen] = useState(false);

  const showManager = useCanAccessManagerNav();
  const navSections = useMemo(
    () => buildNavSections(!!showManager),
    [showManager],
  );

  useEffect(() => {
    if (loading) return;
    if (!token) {
      router.replace('/login');
      return;
    }
  }, [loading, token, router]);

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

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

  const renderUserFooter = (onNavigate?: () => void) => (
    <div className="mt-auto border-t border-ps-border pt-6">
      <p className="mb-1 text-ps-sm text-ps-fg-muted">{user?.email}</p>
      <p className="mb-3 text-ps-sm">
        {user?.name ?? '—'} · {user?.role}
      </p>
      <Link
        href="/profile"
        onClick={onNavigate}
        className="mb-2 inline-block text-ps-xs text-ps-primary hover:no-underline"
      >
        View profile
      </Link>
      <Button
        type="button"
        variant="secondary"
        className="w-full"
        onClick={() => {
          onNavigate?.();
          logout();
        }}
      >
        Sign out
      </Button>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-ps-border bg-ps-bg-card px-4 py-3 lg:hidden">
        <button
          type="button"
          onClick={() => setNavOpen(true)}
          className="inline-flex items-center justify-center rounded-ps border border-ps-border p-2 text-ps-fg transition-colors hover:bg-ps-surface-hover"
          aria-expanded={navOpen}
          aria-haspopup="dialog"
          aria-controls="dashboard-mobile-nav"
          aria-label="Open menu"
        >
          <MenuIcon className="h-5 w-5" />
        </button>
        <Link href="/" className="flex min-w-0 flex-1 justify-center">
          <Image
            src="/priority-soft-logo.png"
            alt="Priority Soft"
            width={140}
            height={28}
            className="h-7 w-auto max-w-full"
            priority
          />
        </Link>
        <div className="shrink-0">
          <NotificationsPanel placement="header" />
        </div>
      </header>

      <Transition show={navOpen}>
        <Dialog
          open={navOpen}
          onClose={setNavOpen}
          className="relative z-40 lg:hidden"
        >
          <TransitionChild
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <DialogBackdrop className="fixed inset-0 bg-black/60" />
          </TransitionChild>
          <TransitionChild
            enter="ease-out duration-200"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="ease-in duration-150"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <DialogPanel
              id="dashboard-mobile-nav"
              className="fixed inset-y-0 left-0 flex w-[min(18rem,88vw)] flex-col overflow-y-auto border-r border-ps-border bg-ps-bg-card p-6 shadow-ps-lg"
            >
          <div className="mb-6 flex items-center justify-between gap-2">
            <DialogTitle className="text-lg font-semibold text-ps-fg">
              Menu
            </DialogTitle>
            <button
              type="button"
              onClick={() => setNavOpen(false)}
              className="rounded-ps p-2 text-ps-fg-muted transition-colors hover:bg-ps-surface-hover hover:text-ps-fg"
              aria-label="Close menu"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>
          <DashboardNavLinks
            pathname={pathname}
            sections={navSections}
            onNavigate={() => setNavOpen(false)}
          />
          {renderUserFooter(() => setNavOpen(false))}
            </DialogPanel>
          </TransitionChild>
        </Dialog>
      </Transition>

      <aside className="hidden w-60 shrink-0 flex-col gap-4 border-r border-ps-border bg-ps-bg-card p-6 lg:flex">
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
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <DashboardNavLinks pathname={pathname} sections={navSections} />
        </div>
        {renderUserFooter()}
      </aside>

      <main className="flex-1 bg-ps-bg p-4 sm:p-6">{children}</main>
    </div>
  );
}
