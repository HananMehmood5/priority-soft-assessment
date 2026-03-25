"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/libs/ui/PageHeader";
import {
  MyRequestsTable,
  type RequestRow,
} from "@/features/requests/components/MyRequestsTable";
import { MY_REQUESTS_QUERY, CANCEL_MUTATION, LOCATIONS_QUERY } from "@/lib/apollo/operations";
import { useSocket } from "@/lib/use-socket";

export function MyRequestsContainer() {
  const { token } = useAuth();
  const socket = useSocket();
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const { data: locationsData } = useQuery<{ locations: { id: string }[] }>(LOCATIONS_QUERY, {
    skip: !token,
  });

  const { data, loading, error, refetch } = useQuery<{
    myRequests: RequestRow[];
  }>(MY_REQUESTS_QUERY, { skip: !token });

  const [cancelRequest] = useMutation(CANCEL_MUTATION, {
    refetchQueries: [{ query: MY_REQUESTS_QUERY }],
  });

  const requests = data?.myRequests ?? [];

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
