'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useAuth } from '@/lib/auth-context';
import { formatDateTime } from '@/lib/format-date';
import { RequestType, RequestStatus } from '@shiftsync/shared';
import {
  PENDING_REQUESTS_QUERY,
  APPROVE_MUTATION,
  REJECT_MUTATION,
} from '@/lib/apollo/operations';

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
  const { token } = useAuth();
  const [acting, setActing] = useState<string | null>(null);

  const { data, loading, error } = useQuery<{ pendingRequests: RequestRow[] }>(
    PENDING_REQUESTS_QUERY,
    { skip: !token }
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

  if (loading) return <p className="text-ps-fg-muted">Loading…</p>;
  if (error) return <p className="text-ps-error">{error.message}</p>;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Approval queue</h1>
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
                      <button
                        type="button"
                        className="mr-2 inline-flex items-center justify-center rounded-ps bg-ps-primary px-4 py-2 text-sm font-semibold text-ps-primary-foreground shadow-ps transition-colors hover:bg-ps-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={!!acting}
                        onClick={() => handleApprove(r.id)}
                      >
                        {acting === r.id ? '…' : 'Approve'}
                      </button>
                    )}
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-ps border border-ps-border px-4 py-2 text-sm font-medium text-ps-fg transition-colors hover:border-ps-fg-subtle hover:bg-ps-surface-hover disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={!!acting}
                      onClick={() => handleReject(r.id)}
                    >
                      {acting === r.id ? '…' : 'Reject'}
                    </button>
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
