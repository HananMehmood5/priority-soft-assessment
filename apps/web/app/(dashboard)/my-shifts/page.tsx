'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useAuth } from '@/lib/auth-context';
import { formatDateTime } from '@/lib/format-date';
import type { ShiftAssignmentAttributes } from '@shiftsync/shared';
import {
  MY_ASSIGNMENTS_QUERY,
  CREATE_SWAP_MUTATION,
  CREATE_DROP_MUTATION,
} from '@/lib/apollo/operations';

type AssignmentWithShift = ShiftAssignmentAttributes & {
  shift?: { id: string; locationId: string; startAt: string; endAt: string; published: boolean };
};

export default function MyShiftsPage() {
  const { token } = useAuth();
  const [acting, setActing] = useState<string | null>(null);

  const { data, loading, error } = useQuery<{ myAssignments: AssignmentWithShift[] }>(
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

  if (loading) return <p className="text-ps-fg-muted">Loading…</p>;
  if (error) return <p className="text-ps-error">{error.message}</p>;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">My shifts</h1>
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
                    {formatDateTime(a.shift.startAt)} – {formatDateTime(a.shift.endAt)}
                    {a.shift.published ? ' · Published' : ''}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-ps border border-ps-border px-4 py-2 text-sm font-medium text-ps-fg transition-colors hover:border-ps-fg-subtle hover:bg-ps-surface-hover disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={!!acting}
                  onClick={() => handleCreateSwap(a.id)}
                >
                  {acting === a.id ? 'Requesting…' : 'Request swap'}
                </button>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-ps border border-ps-border px-4 py-2 text-sm font-medium text-ps-fg transition-colors hover:border-ps-fg-subtle hover:bg-ps-surface-hover disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={!!acting}
                  onClick={() => handleCreateDrop(a.id)}
                >
                  {acting === a.id ? 'Requesting…' : 'Request drop'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
