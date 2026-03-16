"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/libs/ui/PageHeader";
import {
  MyRequestsTable,
  type RequestRow,
} from "@/features/requests/components/MyRequestsTable";
import { MY_REQUESTS_QUERY, CANCEL_MUTATION } from "@/lib/apollo/operations";

export function MyRequestsContainer() {
  const { token } = useAuth();
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const { data, loading, error } = useQuery<{
    myRequests: RequestRow[];
  }>(MY_REQUESTS_QUERY, { skip: !token });

  const [cancelRequest] = useMutation(CANCEL_MUTATION, {
    refetchQueries: [{ query: MY_REQUESTS_QUERY }],
  });

  const requests = data?.myRequests ?? [];

  const handleCancel = async (requestId: string) => {
    if (!token) return;
    setCancellingId(requestId);
    try {
      await cancelRequest({ variables: { requestId } });
    } catch {
      // error from mutation can be shown if needed
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) return <p className="text-ps-fg-muted">Loading…</p>;
  if (error) return <p className="text-ps-error">{error.message}</p>;

  return (
    <div>
      <PageHeader title="Pending swaps & drops" />
      <MyRequestsTable
        requests={requests}
        onCancel={handleCancel}
        cancellingId={cancellingId}
      />
    </div>
  );
}
