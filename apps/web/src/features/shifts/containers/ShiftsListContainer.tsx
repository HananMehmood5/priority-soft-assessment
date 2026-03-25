"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/libs/ui/PageHeader";
import { Button } from "@/libs/ui/Button";
import { Modal } from "@/src/components/Modal";
import { ShiftListTable } from "@/features/shifts/components/ShiftListTable";
import { ShiftForm } from "@/features/shifts/components/ShiftForm";
import { SHIFTS_WITH_LOCATIONS_QUERY, CREATE_SHIFT_MUTATION } from "@/lib/apollo/operations";
import type { LocationAttributes, ShiftAttributes } from "@shiftsync/shared";
import { PlusIcon } from "@/src/components/icons/PlusIcon";

type ShiftsWithLocationsData = {
  shifts: ShiftAttributes[];
  locations: LocationAttributes[];
};

export function ShiftsListContainer() {
  const { token } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [locationId, setLocationId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [dailyStartTime, setDailyStartTime] = useState("");
  const [dailyEndTime, setDailyEndTime] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  const { data, loading, error } = useQuery<ShiftsWithLocationsData>(
    SHIFTS_WITH_LOCATIONS_QUERY,
    { skip: !token }
  );

  const shifts = data?.shifts ?? [];
  const locations = data?.locations ?? [];

  const [createShift, { loading: creating }] = useMutation(CREATE_SHIFT_MUTATION, {
    refetchQueries: [{ query: SHIFTS_WITH_LOCATIONS_QUERY }],
  });

  const handleOpenCreate = () => {
    setCreateError(null);
    if (locations.length > 0 && !locationId) {
      setLocationId(locations[0].id);
    }
    setStartDate("");
    setEndDate("");
    setDaysOfWeek([0, 1, 2, 3, 4, 5, 6]);
    setDailyStartTime("");
    setDailyEndTime("");
    setCreateOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !locationId ||
      !startDate ||
      !endDate ||
      !dailyStartTime ||
      !dailyEndTime ||
      !Array.isArray(daysOfWeek) ||
      daysOfWeek.length === 0
    ) {
      setCreateError("Location, start/end dates, and daily start/end times are required.");
      return;
    }
    setCreateError(null);
    try {
      await createShift({
        variables: {
          input: {
            locationId,
            startDate,
            endDate,
            daysOfWeek,
            dailyStartTime,
            dailyEndTime,
          },
        },
      });
      setCreateOpen(false);
    } catch (err: unknown) {
      setCreateError((err as Error)?.message ?? "Unable to create shift.");
    }
  };

  if (loading) return <p className="text-ps-fg-muted">Loading shifts…</p>;
  if (error) return <p className="text-ps-error">{error.message}</p>;

  return (
    <div>
      <PageHeader
        title="Shifts"
        action={
          <Button type="button" variant="primary" onClick={handleOpenCreate}>
            <PlusIcon className="h-3.5 w-3.5" />
            <span>New shift</span>
          </Button>
        }
      />
      <ShiftListTable shifts={shifts} locations={locations} />
      {createOpen && (
        <Modal
          open
          onClose={() => !creating && setCreateOpen(false)}
          title="New shift"
          maxWidth="md"
          footer={
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => !creating && setCreateOpen(false)}
                className="text-ps-sm text-ps-fg-muted underline-offset-2 hover:underline"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="create-shift-form"
                disabled={creating}
                className="inline-flex items-center justify-center rounded-ps bg-ps-primary px-4 py-2 text-sm font-semibold text-ps-primary-foreground shadow-ps transition-colors hover:bg-ps-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {creating ? "Creating…" : "Create shift"}
              </button>
            </div>
          }
        >
          <div className="flex flex-col gap-4">
            <ShiftForm
              formId="create-shift-form"
              locations={locations}
              locationId={locationId || (locations[0]?.id ?? "")}
              startDate={startDate}
              endDate={endDate}
              daysOfWeek={daysOfWeek}
              dailyStartTime={dailyStartTime}
              dailyEndTime={dailyEndTime}
              submitting={creating}
              error={createError}
              onLocationChange={setLocationId}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              onDaysOfWeekChange={setDaysOfWeek}
              onDailyStartTimeChange={setDailyStartTime}
              onDailyEndTimeChange={setDailyEndTime}
              onSubmit={handleSubmit}
              showSubmitButton={false}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
