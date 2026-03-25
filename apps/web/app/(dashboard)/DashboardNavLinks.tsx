'use client';

import { AppNavLink } from '@/libs/ui/AppNavLink';
import type { NavSection } from './dashboard-nav-config';

type Props = {
  pathname: string;
  sections: NavSection[];
  onNavigate?: () => void;
};

export function DashboardNavLinks({ pathname, sections, onNavigate }: Props) {
  return (
    <>
      {sections.map((section) => (
        <div key={section.heading} className="mb-4 last:mb-0">
          <p className="mb-2 px-3 text-ps-xs font-semibold uppercase tracking-wide text-ps-fg-subtle">
            {section.heading}
          </p>
          <nav className="flex flex-col gap-0.5" aria-label={section.heading}>
            {section.items.map(({ href, label, Icon, end }) => (
              <AppNavLink
                key={href}
                href={href}
                pathname={pathname}
                end={end !== false}
                onClick={onNavigate}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </AppNavLink>
            ))}
          </nav>
        </div>
      ))}
    </>
  );
}
