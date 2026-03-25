'use client';

import Link from 'next/link';
import { useCanAccessManagerNav } from '@/lib/hooks/use-role';
import { PageHeader } from '@/libs/ui/PageHeader';

const STAFF_LINKS = [
  { href: '/calendar', label: 'Calendar', hint: 'Week and day view by location timezone' },
  { href: '/my-shifts', label: 'My shifts', hint: 'Assignments, swaps, and drops' },
  { href: '/requests', label: 'Requests', hint: 'Track your pending activity' },
  { href: '/drops', label: 'Available drops', hint: 'Pick up released shifts' },
  { href: '/swaps', label: 'Available swaps', hint: 'Accept open swap offers' },
] as const;

const MANAGER_LINKS = [
  { href: '/people', label: 'People', hint: 'Staff, skills, and certifications' },
  { href: '/shifts', label: 'Shifts', hint: 'Templates and publishing' },
  { href: '/approvals', label: 'Approvals', hint: 'Finalize swaps and drops' },
  { href: '/on-duty', label: 'On-duty', hint: 'Live coverage by location' },
] as const;

export default function DashboardHome() {
  const showManagement = useCanAccessManagerNav();

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="ShiftSync keeps scheduling, swaps, and coverage in one place. Use the shortcuts below or the sidebar."
      />

      <section className="mb-8">
        <h2 className="mb-3 text-ps-xs font-semibold uppercase tracking-wide text-ps-fg-subtle">
          Schedule and requests
        </h2>
        <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 xl:grid-cols-3">
          {STAFF_LINKS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="block rounded-ps border border-ps-border bg-ps-bg-card p-4 shadow-ps transition-colors hover:border-ps-primary-muted hover:bg-ps-surface no-underline hover:no-underline"
              >
                <span className="font-semibold text-ps-fg">{item.label}</span>
                <p className="mt-1 text-ps-sm text-ps-fg-muted">{item.hint}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {showManagement ? (
        <section>
          <h2 className="mb-3 text-ps-xs font-semibold uppercase tracking-wide text-ps-fg-subtle">
            Management
          </h2>
          <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 xl:grid-cols-3">
            {MANAGER_LINKS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block rounded-ps border border-ps-border bg-ps-bg-card p-4 shadow-ps transition-colors hover:border-ps-primary-muted hover:bg-ps-surface no-underline hover:no-underline"
                >
                  <span className="font-semibold text-ps-fg">{item.label}</span>
                  <p className="mt-1 text-ps-sm text-ps-fg-muted">{item.hint}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
