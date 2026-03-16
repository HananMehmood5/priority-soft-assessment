"use client";

import { useQuery } from "@apollo/client";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/libs/ui/PageHeader";
import { Button } from "@/libs/ui/Button";
import { ShiftListTable } from "@/features/shifts/components/ShiftListTable";
import { SHIFTS_WITH_LOCATIONS_QUERY } from "@/lib/apollo/operations";
import type { ShiftsWithLocationsQuery } from "@/generated/graphql-types";

export function ShiftsListContainer() {
  const { token } = useAuth();

  const { data, loading, error } = useQuery<ShiftsWithLocationsQuery>(
    SHIFTS_WITH_LOCATIONS_QUERY,
    { skip: !token }
  );

  const shifts = data?.shifts ?? [];
  const locations = data?.locations ?? [];

  if (loading) return <p className="text-ps-fg-muted">Loading shifts…</p>;
  if (error) return <p className="text-ps-error">{error.message}</p>;

  return (
    <div>
      <PageHeader
        title="Shifts"
        action={
          <Button href="/shifts/new" variant="primary">
            New shift
          </Button>
        }
      />
      <ShiftListTable shifts={shifts} locations={locations} />
    </div>
  );
}
