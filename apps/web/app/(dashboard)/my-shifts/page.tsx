'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useAuth } from '@/lib/auth-context';
import type { ShiftAssignmentAttributes } from '@shiftsync/shared';
import {
  MY_ASSIGNMENTS_QUERY,
  CREATE_SWAP_MUTATION,
  CREATE_DROP_MUTATION,
  LOCATIONS_QUERY,
} from '@/lib/apollo/operations';
import { useSocket } from '@/lib/use-socket';
import { PageHeader } from '@/libs/ui/PageHeader';
import { ErrorState } from '@/libs/ui/ErrorState';
import { PageSkeleton } from '@/libs/ui/PageSkeleton';
import { Button } from '@/libs/ui/Button';

const MY_SHIFTS_DESCRIPTION =
  'Your assigned shifts. Request a swap to trade with another staff member, or drop to release for others to pick up.';

type AssignmentWithShift = ShiftAssignmentAttributes & {
  shift?: {
    id: string;
    locationId: string;
    startDate: string;
    endDate: string;
    dailyStartTime: string;
    dailyEndTime: string;
    published: boolean;
  };
};

export default function MyShiftsPage() {
  const { token } = useAuth();
  const socket = useSocket();
  const [acting, setActing] = useState<string | null>(null);

  const { data: locationsData } = useQuery<{ locations: { id: string }[] }>(LOCATIONS_QUERY, {
    skip: !token,
  });

  const { data, loading, error, refetch } = useQuery<{ myAssignments: AssignmentWithShift[] }>(
    MY_ASSIGNMENTS_QUERY,
    { skip: !token }
  );
  const [createSwap] = useMutation(CREATE_SWAP_MUTATION, {
    refetchQueries: [{ query: MY_ASSIGNMENTS_QUERY }],
  });
  const [createDrop] = useMutation(CREATE_DROP_MUTATION, {
    refetchQueries: [{ query: MY_ASSIGNMENTS_QUERY }],
  });

  const assignments = data?.myAssignments ?? [];

  useEffect(() => {
    if (!socket) return;
    const locationIds = locationsData?.locations?.map((l) => l.id) ?? [];
    locationIds.forEach((locationId) => {
      socket.emit('subscribe_location', { locationId });
    });

    const refreshEvents = [
      'schedule_published',
      'schedule_updated',
      'swap_request',
      'swap_resolved',
      'drop_request',
      'drop_resolved',
      'assignment_conflict',
    ];
    const handler = () => refetch();
    refreshEvents.forEach((ev) => socket.on(ev, handler));
    return () => {
      refreshEvents.forEach((ev) => socket.off(ev, handler));
    };
  }, [socket, refetch, locationsData]);

  const handleCreateSwap = async (assignmentId: string) => {
    if (!token) return;
    setActing(assignmentId);
    try {
      await createSwap({ variables: { assignmentId } });
    } catch {
      // error can be shown via mutation error if needed
    } finally {
      setActing(null);
    }
  };

  const handleCreateDrop = async (assignmentId: string) => {
    if (!token) return;
    setActing(assignmentId);
    try {
      await createDrop({ variables: { assignmentId } });
    } catch {
      // error can be shown via mutation error if needed
    } finally {
      setActing(null);
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="My shifts" description={MY_SHIFTS_DESCRIPTION} />
        <PageSkeleton />
      </div>
    );
  }
  if (error) {
    return (
      <div>
        <PageHeader title="My shifts" description={MY_SHIFTS_DESCRIPTION} />
        <ErrorState message={error.message} onRetry={() => refetch()} variant="card" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="My shifts" description={MY_SHIFTS_DESCRIPTION} />
      {assignments.length === 0 ? (
        <p className="text-ps-fg-muted">You have no assigned shifts.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {assignments.map((a) => (
            <div
              key={a.id}
              className="rounded-ps border border-ps-border bg-ps-bg-card p-4"
            >
              <div className="mb-2">
                <span className="text-ps-fg-muted">Shift </span>
                <strong>{a.shiftId}</strong>
                {a.shift && (
                  <span className="ml-2 text-ps-fg-muted">
                    Location {a.shift.locationId} ·{' '}
                    {a.shift.dailyStartTime}–{a.shift.dailyEndTime} from {a.shift.startDate} to{' '}
                    {a.shift.endDate}
                    {a.shift.published ? ' · Published' : ''}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={!!acting}
                  loading={acting === a.id}
                  loadingLabel="Requesting…"
                  onClick={() => handleCreateSwap(a.id)}
                >
                  Request swap
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={!!acting}
                  loading={acting === a.id}
                  loadingLabel="Requesting…"
                  onClick={() => handleCreateDrop(a.id)}
                >
                  Request drop
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
