import Link, { type LinkProps } from 'next/link';
import type { ReactNode } from 'react';

export type AppNavLinkProps = Omit<LinkProps, 'className' | 'href'> & {
  href: string;
  pathname: string;
  /** When true, only exact `pathname === href` counts as active (default for most items). */
  end?: boolean;
  children: ReactNode;
  className?: string;
};

function isNavActive(pathname: string, href: string, end: boolean): boolean {
  if (end || href === '/') {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

const activeClass =
  'flex items-center gap-2 rounded-ps px-3 py-2 text-sm bg-ps-primary-muted font-semibold text-ps-primary no-underline hover:no-underline';
const inactiveClass =
  'flex items-center gap-2 rounded-ps px-3 py-2 text-sm text-ps-fg no-underline hover:no-underline hover:bg-ps-surface-hover';

export function AppNavLink({
  href,
  pathname,
  end = true,
  children,
  className = '',
  ...rest
}: AppNavLinkProps) {
  const active = isNavActive(pathname, href, end);
  return (
    <Link
      href={href}
      className={[active ? activeClass : inactiveClass, className]
        .filter(Boolean)
        .join(' ')}
      aria-current={active ? 'page' : undefined}
      {...rest}
    >
      {children}
    </Link>
  );
}
