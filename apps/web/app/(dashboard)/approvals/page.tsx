'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useAuth } from '@/lib/auth-context';
import { formatDateTime } from '@/lib/format-date';
import { RequestType, RequestStatus, UserRole } from '@shiftsync/shared';
import { useSocket } from '@/lib/use-socket';
import {
  PENDING_REQUESTS_QUERY,
  APPROVE_MUTATION,
  REJECT_MUTATION,
  LOCATIONS_QUERY,
} from '@/lib/apollo/operations';
import { PageHeader } from '@/libs/ui/PageHeader';
import { ErrorState } from '@/libs/ui/ErrorState';
import { PageSkeleton } from '@/libs/ui/PageSkeleton';
import { Button } from '@/libs/ui/Button';

const APPROVALS_DESCRIPTION =
  'Review accepted swap and drop requests before they are finalized on the schedule.';

type RequestRow = {
  id: string;
  type: string;
  assignmentId: string;
  counterpartAssignmentId: string | null;
  claimerUserId: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export default function ApprovalsPage() {
  const { token, user } = useAuth();
  const [acting, setActing] = useState<string | null>(null);

  const canAccess =
    user?.role === UserRole.Admin || user?.role === UserRole.Manager;

  const socket = useSocket();

  const { data: locationsData } = useQuery<{ locations: { id: string }[] }>(LOCATIONS_QUERY, {
    skip: !token || !canAccess,
  });

  const { data, loading, error, refetch } = useQuery<{ pendingRequests: RequestRow[] }>(
    PENDING_REQUESTS_QUERY,
    { skip: !token || !canAccess }
  );
  const [approveRequest] = useMutation(APPROVE_MUTATION, {
    refetchQueries: [{ query: PENDING_REQUESTS_QUERY }],
  });
  const [rejectRequest] = useMutation(REJECT_MUTATION, {
    refetchQueries: [{ query: PENDING_REQUESTS_QUERY }],
  });

  const requests = data?.pendingRequests ?? [];

  const handleApprove = async (requestId: string) => {
    if (!token) return;
    setActing(requestId);
    try {
      await approveRequest({ variables: { requestId } });
    } catch {
      // error can be shown via mutation error if needed
    } finally {
      setActing(null);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!token) return;
    setActing(requestId);
    try {
      await rejectRequest({ variables: { requestId } });
    } catch {
      // error can be shown via mutation error if needed
    } finally {
      setActing(null);
    }
  };

  const canApprove = (r: RequestRow) => r.status === RequestStatus.Accepted;

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
    ];
    const handler = () => refetch();
    refreshEvents.forEach((ev) => socket.on(ev, handler));
    return () => {
      refreshEvents.forEach((ev) => socket.off(ev, handler));
    };
  }, [socket, refetch, locationsData]);

  if (!user) return <p className="text-ps-fg-muted">Loading…</p>;
  if (!canAccess) {
    return <p className="text-ps-error">You do not have access to the approval queue.</p>;
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Approval queue" description={APPROVALS_DESCRIPTION} />
        <PageSkeleton lines={5} />
      </div>
    );
  }
  if (error) {
    return (
      <div>
        <PageHeader title="Approval queue" description={APPROVALS_DESCRIPTION} />
        <ErrorState message={error.message} onRetry={() => refetch()} variant="card" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Approval queue" description={APPROVALS_DESCRIPTION} />
      {requests.length === 0 ? (
        <p className="text-ps-fg-muted">No pending or accepted requests.</p>
      ) : (
        <div className="overflow-hidden rounded-ps border border-ps-border bg-ps-bg-card">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-ps-border text-left">
                <th className="px-3 py-3 font-semibold">Type</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-3 py-3 font-semibold">Assignment</th>
                <th className="px-3 py-3 font-semibold">Created</th>
                <th className="px-3 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} className="border-b border-ps-border">
                  <td className="px-3 py-3">{r.type === RequestType.Swap ? 'Swap' : 'Drop'}</td>
                  <td className="px-3 py-3">{r.status}</td>
                  <td className="px-3 py-3 text-ps-fg-muted">{r.assignmentId.slice(0, 8)}…</td>
                  <td className="px-3 py-3 text-ps-fg-muted">{formatDateTime(r.createdAt)}</td>
                  <td className="px-3 py-3">
                    {canApprove(r) && (
                      <Button
                        type="button"
                        variant="primary"
                        className="mr-2"
                        disabled={!!acting}
                        loading={acting === r.id}
                        loadingLabel="…"
                        onClick={() => handleApprove(r.id)}
                      >
                        Approve
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={!!acting}
                      loading={acting === r.id}
                      loadingLabel="…"
                      onClick={() => handleReject(r.id)}
                    >
                      Reject
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
