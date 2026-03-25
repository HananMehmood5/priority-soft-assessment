'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useAuth } from '@/lib/auth-context';
import {
  AVAILABLE_SWAPS_QUERY,
  MY_ASSIGNMENTS_QUERY,
  ACCEPT_SWAP_MUTATION,
  LOCATIONS_QUERY,
} from '@/lib/apollo/operations';
import { useSocket } from '@/lib/use-socket';

type SwapRequest = {
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

type MyAssignment = {
  id: string;
  shiftId: string;
  shift?: { id: string; locationId: string; startDate: string; endDate: string; dailyStartTime: string; dailyEndTime: string };
};

export default function SwapsPage() {
  const { token } = useAuth();
  const socket = useSocket();
  const [constraintError, setConstraintError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [selectedCounterpart, setSelectedCounterpart] = useState<Record<string, string>>({});

  const swapsQuery = useQuery<{ availableSwaps: SwapRequest[] }>(
    AVAILABLE_SWAPS_QUERY,
    { skip: !token }
  );
  const assignmentsQuery = useQuery<{ myAssignments: MyAssignment[] }>(
    MY_ASSIGNMENTS_QUERY,
    { skip: !token }
  );
  const { data: locationsData } = useQuery<{ locations: { id: string }[] }>(LOCATIONS_QUERY, {
    skip: !token,
  });

  const [acceptSwap] = useMutation<{
    acceptSwapRequest: {
      request?: { id: string; status: string };
      constraintError?: { message: string };
    };
  }>(ACCEPT_SWAP_MUTATION, {
    refetchQueries: [
      { query: AVAILABLE_SWAPS_QUERY },
      { query: MY_ASSIGNMENTS_QUERY },
    ],
  });

  const swaps = swapsQuery.data?.availableSwaps ?? [];
  const myAssignments = assignmentsQuery.data?.myAssignments ?? [];
  const loading = swapsQuery.loading || assignmentsQuery.loading;
  const error = swapsQuery.error?.message ?? assignmentsQuery.error?.message ?? null;

  const refetchSwaps = swapsQuery.refetch;
  const refetchAssignments = assignmentsQuery.refetch;

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
    const handler = () => {
      refetchSwaps();
      refetchAssignments();
    };
    refreshEvents.forEach((ev) => socket.on(ev, handler));
    return () => {
      refreshEvents.forEach((ev) => socket.off(ev, handler));
    };
  }, [
    socket,
    locationsData,
    refetchSwaps,
    refetchAssignments,
  ]);

  const handleAccept = async (requestId: string, counterpartAssignmentId: string) => {
    if (!token || !counterpartAssignmentId) return;
    setAccepting(requestId);
    setConstraintError(null);
    try {
      const res = await acceptSwap({
        variables: { requestId, counterpartAssignmentId },
      });
      const result = res.data?.acceptSwapRequest;
      if (result?.constraintError) {
        setConstraintError(result.constraintError.message);
      } else if (result?.request) {
        setSelectedCounterpart((prev) => {
          const next = { ...prev };
          delete next[requestId];
          return next;
        });
      }
    } catch {
      // network error can be shown via mutation error if needed
    } finally {
      setAccepting(null);
    }
  };

  if (loading) return <p className="text-ps-fg-muted">Loading…</p>;
  if (error) return <p className="text-ps-error">{error}</p>;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Available swaps</h1>
      {constraintError && (
        <div className="mb-4 rounded-ps border border-ps-primary bg-ps-primary-muted p-3 text-ps-warning">
          {constraintError}
        </div>
      )}
      {swaps.length === 0 ? (
        <p className="text-ps-fg-muted">No swap requests available to accept.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {swaps.map((s) => (
            <div
              key={s.id}
              className="rounded-ps border border-ps-border bg-ps-bg-card p-4"
            >
              <div className="mb-3 text-ps-sm text-ps-fg-muted">
                {s.assignment?.shift && (
                  <span>
                    Shift: Location {s.assignment.shift.locationId} ·{' '}
                    {s.assignment.shift.dailyStartTime}–{s.assignment.shift.dailyEndTime} from{' '}
                    {s.assignment.shift.startDate} to {s.assignment.shift.endDate}
                  </span>
                )}
                {!s.assignment?.shift && (
                  <span>Assignment {s.assignmentId}</span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <label className="text-sm">
                  Swap with my shift:
                  <select
                    value={selectedCounterpart[s.id] ?? ''}
                    onChange={(e) =>
                      setSelectedCounterpart((prev) => ({
                        ...prev,
                        [s.id]: e.target.value,
                      }))
                    }
                    className="ml-2 rounded-ps border border-ps-border bg-ps-bg-card px-2 py-1 text-sm text-ps-fg outline-none focus:border-ps-border-focus focus:ring-2 focus:ring-ps-border-focus"
                  >
                    <option value="">Select…</option>
                    {myAssignments.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.shift
                          ? `${a.shift.locationId} ${a.shift.startDate} ${a.shift.dailyStartTime}`
                          : a.id.slice(0, 8)}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-ps bg-ps-primary px-4 py-2 text-sm font-semibold text-ps-primary-foreground shadow-ps transition-colors hover:bg-ps-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={!!accepting || !selectedCounterpart[s.id]}
                  onClick={() =>
                    selectedCounterpart[s.id] &&
                    handleAccept(s.id, selectedCounterpart[s.id])
                  }
                >
                  {accepting === s.id ? 'Accepting…' : 'Accept swap'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
