import { useAuth } from '@/lib/auth-context';
import { UserRole } from '@shiftsync/shared';

export function useIsAdmin(): boolean {
  const { user } = useAuth();
  return user?.role === UserRole.Admin;
}

/** Admin or Manager — manager nav, reports, approvals, etc. */
export function useCanAccessManagerNav(): boolean {
  const { user } = useAuth();
  return (
    user?.role === UserRole.Admin || user?.role === UserRole.Manager
  );
}
