'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useAuth } from '@/lib/auth-context';
import { AVAILABLE_DROPS_QUERY, ACCEPT_DROP_MUTATION, LOCATIONS_QUERY } from '@/lib/apollo/operations';
import { useSocket } from '@/lib/use-socket';

type DropRequest = {
  id: string;
  type: string;
  assignmentId: string;
  status: string;
  createdAt: string;
  assignment?: {
    id: string;
    shiftId: string;
    shift?: { id: string; locationId: string; startDate: string; endDate: string; dailyStartTime: string; dailyEndTime: string };
  };
};

export default function DropsPage() {
  const { token } = useAuth();
  const socket = useSocket();
  const [constraintError, setConstraintError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState<string | null>(null);

  const { data: locationsData } = useQuery<{ locations: { id: string }[] }>(LOCATIONS_QUERY, {
    skip: !token,
  });

  const { data, loading, error, refetch } = useQuery<{
    availableDrops: DropRequest[];
  }>(AVAILABLE_DROPS_QUERY, { skip: !token });

  const [acceptDrop] = useMutation<{
    acceptDropRequest: {
      request?: { id: string; status: string };
      constraintError?: { message: string };
    };
  }>(ACCEPT_DROP_MUTATION, {
    refetchQueries: [{ query: AVAILABLE_DROPS_QUERY }],
  });

  const drops = data?.availableDrops ?? [];

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

  const handleAccept = async (requestId: string) => {
    if (!token) return;
    setAccepting(requestId);
    setConstraintError(null);
    try {
      const res = await acceptDrop({ variables: { requestId } });
      const result = res.data?.acceptDropRequest;
      if (result?.constraintError) {
        setConstraintError(result.constraintError.message);
      }
    } catch {
      // network error surfaced via mutation error if needed
    } finally {
      setAccepting(null);
    }
  };

  if (loading) return <p className="text-ps-fg-muted">Loading…</p>;
  if (error) return <p className="text-ps-error">{error.message}</p>;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Available drops</h1>
      {constraintError && (
        <div className="mb-4 rounded-ps border border-ps-primary bg-ps-primary-muted p-3 text-ps-warning">
          {constraintError}
        </div>
      )}
      {drops.length === 0 ? (
        <p className="text-ps-fg-muted">No drops available to pick up.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {drops.map((d) => (
            <div
              key={d.id}
              className="rounded-ps border border-ps-border bg-ps-bg-card p-4"
            >
              <div className="mb-2 text-ps-sm text-ps-fg-muted">
                {d.assignment?.shift && (
                  <span>
                    Location {d.assignment.shift.locationId} ·{' '}
                    {d.assignment.shift.dailyStartTime}–{d.assignment.shift.dailyEndTime} from{' '}
                    {d.assignment.shift.startDate} to {d.assignment.shift.endDate}
                  </span>
                )}
                {!d.assignment?.shift && (
                  <span>Assignment {d.assignmentId}</span>
                )}
              </div>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-ps bg-ps-primary px-4 py-2 text-sm font-semibold text-ps-primary-foreground shadow-ps transition-colors hover:bg-ps-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!!accepting}
                onClick={() => handleAccept(d.id)}
              >
                {accepting === d.id ? 'Accepting…' : 'Pick up shift'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
