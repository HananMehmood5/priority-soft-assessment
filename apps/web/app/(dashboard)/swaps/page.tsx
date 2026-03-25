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
import { PageHeader } from '@/libs/ui/PageHeader';
import { QueryStateBoundary } from '@/libs/ui/QueryStateBoundary';
import { Button } from '@/libs/ui/Button';
import { Select } from '@/libs/ui/Select';

const SWAPS_DESCRIPTION =
  'Accept open swap requests and offer one of your assignments as the trade counterpart.';

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

  const refetchSwapsData = () => {
    void refetchSwaps();
    void refetchAssignments();
  };

  return (
    <div>
      <PageHeader title="Available swaps" description={SWAPS_DESCRIPTION} />
      <QueryStateBoundary
        loading={loading}
        error={error}
        onRetry={() => refetchSwapsData()}
      >
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
                <div className="flex flex-wrap items-end gap-2 text-sm">
                  <span className="self-center text-ps-fg">Swap with my shift:</span>
                  <Select
                    value={selectedCounterpart[s.id] ?? ''}
                    onChange={(e) =>
                      setSelectedCounterpart((prev) => ({
                        ...prev,
                        [s.id]: e.target.value,
                      }))
                    }
                    className="min-w-[12rem] w-auto"
                    aria-label="Your shift to offer in swap"
                  >
                    <option value="">Select…</option>
                    {myAssignments.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.shift
                          ? `${a.shift.locationId} ${a.shift.startDate} ${a.shift.dailyStartTime}`
                          : a.id.slice(0, 8)}
                      </option>
                    ))}
                  </Select>
                </div>
                <Button
                  type="button"
                  variant="primary"
                  disabled={!!accepting || !selectedCounterpart[s.id]}
                  loading={accepting === s.id}
                  loadingLabel="Accepting…"
                  onClick={() =>
                    selectedCounterpart[s.id] &&
                    handleAccept(s.id, selectedCounterpart[s.id])
                  }
                >
                  Accept swap
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      </QueryStateBoundary>
    </div>
  );
}
