"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@apollo/client";
import type { LocationAttributes } from "@shiftsync/shared";

import { useAuth } from "@/lib/auth-context";
import { ShiftForm } from "@/features/shifts/components/ShiftForm";
import { PageHeader } from "@/libs/ui/PageHeader";
import { Button } from "@/libs/ui/Button";
import {
  LOCATIONS_QUERY,
  CREATE_SHIFT_MUTATION,
  SHIFTS_QUERY,
} from "@/lib/apollo/operations";

export function CreateShiftContainer() {
  const { token } = useAuth();
  const router = useRouter();
  const [locationId, setLocationId] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");

  const { data: locationsData, loading } = useQuery<{
    locations: LocationAttributes[];
  }>(LOCATIONS_QUERY, { skip: !token });

  const [createShift, { loading: submitting, error: mutateError }] =
    useMutation(CREATE_SHIFT_MUTATION, {
      refetchQueries: [{ query: SHIFTS_QUERY }],
    });

  const locations = useMemo(
    () => locationsData?.locations ?? [],
    [locationsData?.locations]
  );

  useEffect(() => {
    if (locations.length > 0 && !locationId) {
      setLocationId(locations[0].id);
    }
  }, [locations, locationId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      await createShift({
        variables: {
          input: {
            locationId,
            startAt: new Date(startAt).toISOString(),
            endAt: new Date(endAt).toISOString(),
          },
        },
      });
      router.push("/shifts");
    } catch {
      // error surfaced via mutateError
    }
  };

  const error = mutateError?.message ?? null;

  if (loading) return <p className="text-ps-fg-muted">Loading…</p>;

  return (
    <div>
      <Button
        href="/shifts"
        variant="ghost"
        size="sm"
        className="text-ps-fg-muted"
      >
        ← Shifts
      </Button>
      <PageHeader title="New shift" />
      <ShiftForm
        locations={locations}
        locationId={locationId}
        startAt={startAt}
        endAt={endAt}
        submitting={submitting}
        error={error}
        onLocationChange={setLocationId}
        onStartChange={setStartAt}
        onEndChange={setEndAt}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
