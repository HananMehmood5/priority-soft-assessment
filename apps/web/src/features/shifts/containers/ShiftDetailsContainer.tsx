"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "@apollo/client";
import type { ShiftAttributes, SkillAttributes, LocationAttributes } from "@shiftsync/shared";

import { useAuth } from "@/lib/auth-context";
import { ShiftDetailsView } from "@/features/shifts/components/ShiftDetailsView";
import { ShiftAssignmentsSection } from "@/features/shifts/components/ShiftAssignmentsSection";
import { ShiftAuditTimeline } from "@/features/shifts/components/ShiftAuditTimeline";
import { ShiftAssignmentsTable } from "@/features/shifts/components/ShiftAssignmentsTable";
import { ShiftForm } from "@/features/shifts/components/ShiftForm";
import { Modal } from "@/src/components/Modal";
import type { OvertimeWhatIf } from "@/features/shifts/types/OvertimeWhatIf";
import type { ConstraintError } from "@/features/shifts/types/ConstraintError";
import type { AuditEntry } from "@/features/shifts/types/AuditEntry";
import { UserRole } from "@shiftsync/shared";
import { Button } from "@/libs/ui/Button";
import {
  SHIFT_QUERY,
  SHIFTS_WITH_LOCATIONS_QUERY,
  SKILLS_QUERY_MINIMAL,
  STAFF_QUERY,
  ADD_ASSIGNMENT_MUTATION,
  OVERTIME_WHAT_IF_QUERY,
  SHIFT_HISTORY_QUERY,
  PUBLISH_SHIFT_MUTATION,
  UNPUBLISH_SHIFT_MUTATION,
  DELETE_SHIFT_MUTATION,
  LOCATIONS_QUERY,
  UPDATE_SHIFT_MUTATION,
} from "@/lib/apollo/operations";

type AddAssignmentResult = {
  assignment?: { id: string };
  constraintError?: ConstraintError;
};

export function ShiftDetailsContainer() {
  const params = useParams();
  const id = params.id as string;
  const { token, user } = useAuth();
  const canManageAssignments =
    user?.role === UserRole.Admin || user?.role === UserRole.Manager;
  const [userId, setUserId] = useState("");
  const [skillId, setSkillId] = useState("");
  const [constraintError, setConstraintError] = useState<ConstraintError | null>(null);
  const [overtimeOverrideReason, setOvertimeOverrideReason] = useState("");
  const [publishError, setPublishError] = useState<string | null>(null);
  const [unpublishError, setUnpublishError] = useState<string | null>(null);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [addAssignmentOpen, setAddAssignmentOpen] = useState(false);
  const [editDetailsOpen, setEditDetailsOpen] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [dailyStartTime, setDailyStartTime] = useState("");
  const [dailyEndTime, setDailyEndTime] = useState("");

  const shiftQuery = useQuery<{ shift: ShiftAttributes | null }>(SHIFT_QUERY, {
    variables: { id },
    skip: !token || !id,
  });
  const shift = shiftQuery.data?.shift ?? null;
  const skillsQuery = useQuery<{ skills: Pick<SkillAttributes, "id" | "name">[] }>(
    SKILLS_QUERY_MINIMAL,
    { skip: !token }
  );
  const staffQuery = useQuery<{
    staff: Array<{ id: string; name: string | null; email: string }>;
  }>(STAFF_QUERY, {
    variables: {
      locationId: shift?.locationId ?? null,
      skillId: skillId || null,
      role: UserRole.Staff,
    },
    skip: !token || !shift?.locationId || !skillId || !canManageAssignments,
  });
  const historyQuery = useQuery<{ shiftHistory: AuditEntry[] }>(SHIFT_HISTORY_QUERY, {
    variables: { shiftId: id },
    skip: !token || !id,
  });
  const locationsQuery = useQuery<{
    locations: LocationAttributes[];
  }>(LOCATIONS_QUERY, { skip: !token });
  const skills = useMemo(() => skillsQuery.data?.skills ?? [], [skillsQuery.data?.skills]);
  const staffOptions = useMemo(() => {
    const list = staffQuery.data?.staff ?? [];
    return list.map((s) => ({
      id: s.id,
      name: s.name ?? s.email,
    }));
  }, [staffQuery.data?.staff]);

  const overtimeWhatIfQuery = useQuery<{ overtimeWhatIf: OvertimeWhatIf }>(OVERTIME_WHAT_IF_QUERY, {
    variables:
      shift && userId
        ? {
            userId,
            shiftId: shift.id,
          }
        : undefined,
    skip: !token || !shift || !userId || !canManageAssignments,
  });

  const [addAssignment, { loading: assigning }] = useMutation<{
    addAssignment: AddAssignmentResult;
  }>(ADD_ASSIGNMENT_MUTATION, {
    refetchQueries: [
      { query: SHIFT_QUERY, variables: { id } },
      { query: SHIFT_HISTORY_QUERY, variables: { shiftId: id } },
    ],
  });

  const [publishShift, { loading: publishing }] = useMutation(PUBLISH_SHIFT_MUTATION, {
    refetchQueries: [{ query: SHIFT_QUERY, variables: { id } }],
  });
  const [unpublishShift, { loading: unpublishing }] = useMutation(UNPUBLISH_SHIFT_MUTATION, {
    refetchQueries: [{ query: SHIFT_QUERY, variables: { id } }],
  });
  const [updateShift, { loading: updatingShift }] = useMutation(UPDATE_SHIFT_MUTATION, {
    refetchQueries: [
      { query: SHIFT_QUERY, variables: { id } },
      { query: SHIFT_HISTORY_QUERY, variables: { shiftId: id } },
    ],
  });

  useEffect(() => {
    if (skills.length > 0 && !skillId) {
      setSkillId(skills[0].id);
    }
  }, [skills, skillId]);

  const handleAddAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !userId || !skillId) return;
    setConstraintError(null);
    setAssignmentError(null);
    try {
      const res = await addAssignment({
        variables: {
          shiftId: id,
          input: {
            userId,
            skillId,
            overtimeOverrideReason: overtimeOverrideReason || null,
          },
        },
      });
      const result = res.data?.addAssignment;
      if (result?.constraintError) {
        setConstraintError(result.constraintError);
      } else if (result?.assignment) {
        setConstraintError(null);
        setUserId("");
        setOvertimeOverrideReason("");
        setAddAssignmentOpen(false);
      }
    } catch (err: unknown) {
      setAssignmentError((err as Error)?.message ?? "Unable to add assignment.");
    }
  };

  const loading = shiftQuery.loading || skillsQuery.loading;
  const error = shiftQuery.error?.message ?? skillsQuery.error?.message ?? null;
  const history = historyQuery.data?.shiftHistory ?? [];
  const historyError = historyQuery.error?.message ?? null;
  const overtime = overtimeWhatIfQuery.data?.overtimeWhatIf ?? null;
  const overtimeLoading = overtimeWhatIfQuery.loading;
  const overtimeError = overtimeWhatIfQuery.error?.message ?? null;

  const handleTogglePublish = async () => {
    if (!shift || shift.published) return;
    setPublishError(null);
    setUnpublishError(null);
    try {
      await publishShift({ variables: { shiftId: shift.id } });
    } catch (err: unknown) {
      setPublishError((err as Error)?.message ?? "Unable to update publish status.");
    }
  };

  const handleUnpublish = async () => {
    if (!shift || !shift.published) return;
    setUnpublishError(null);
    setPublishError(null);
    try {
      await unpublishShift({ variables: { shiftId: shift.id } });
    } catch (err: unknown) {
      setUnpublishError((err as Error)?.message ?? "Unable to unpublish shift.");
    }
  };

  const openEditDetailsModal = () => {
    if (!shift) return;
    setStartDate(shift.startDate);
    setEndDate(shift.endDate);
    setDaysOfWeek(Array.isArray(shift.daysOfWeek) ? [...shift.daysOfWeek].sort((a, b) => a - b) : [0, 1, 2, 3, 4, 5, 6]);
    setDailyStartTime(shift.dailyStartTime);
    setDailyEndTime(shift.dailyEndTime);
    setEditError(null);
    setEditDetailsOpen(true);
  };

  const handleUpdateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shift) return;
    setEditError(null);
    try {
      await updateShift({
        variables: {
          id: shift.id,
          input: {
            startDate,
            endDate,
            daysOfWeek,
            dailyStartTime,
            dailyEndTime,
          },
        },
      });
      setEditDetailsOpen(false);
    } catch (err: unknown) {
      setEditError((err as Error)?.message ?? "Unable to update shift details.");
    }
  };

  const [deleteShiftMutation, { loading: deleting }] = useMutation(DELETE_SHIFT_MUTATION, {
    refetchQueries: [{ query: SHIFTS_WITH_LOCATIONS_QUERY }],
  });

  const handleDelete = async () => {
    if (!shift) return;
    setPublishError(null);
    try {
      await deleteShiftMutation({ variables: { id: shift.id } });
      window.location.href = "/shifts";
    } catch (err: unknown) {
      setPublishError((err as Error)?.message ?? "Unable to delete shift.");
    }
  };

  if (loading) return <p className="text-ps-fg-muted">Loading…</p>;
  if (error || !shift) return <p className="text-ps-error">{error ?? "Shift not found"}</p>;

  const disableUnpublishDueToCutoff =
    !!unpublishError && unpublishError.toLowerCase().includes("after cutoff");

  return (
    <div>
      <ShiftDetailsView
        shift={shift}
        canEdit={user?.role === UserRole.Admin || user?.role === UserRole.Manager}
        onEdit={openEditDetailsModal}
        editing={updatingShift}
        onTogglePublish={handleTogglePublish}
        publishError={publishError}
        publishing={publishing}
        onUnpublish={disableUnpublishDueToCutoff ? undefined : handleUnpublish}
        unpublishing={unpublishing}
        unpublishError={unpublishError}
        canDelete={user?.role === UserRole.Admin}
        onDelete={() => setConfirmDeleteOpen(true)}
        deleting={deleting}
      />
      <ShiftAssignmentsTable
        assignments={shift.assignments ?? []}
        canAddAssignment={canManageAssignments}
        onAddAssignmentClick={
          canManageAssignments
            ? () => {
                setAddAssignmentOpen(true);
              }
            : undefined
        }
      />
      <ShiftAuditTimeline history={history} error={historyError} />

      {addAssignmentOpen && (
        <Modal
          open
          onClose={() => !assigning && setAddAssignmentOpen(false)}
          title="Add assignment"
          maxWidth="lg"
          footer={
            <div className="flex items-center justify-between gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => !assigning && setAddAssignmentOpen(false)}
                className="font-normal text-ps-sm text-ps-fg-muted underline-offset-2 hover:underline"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="add-assignment-form"
                variant="primary"
                disabled={assigning || !skillId || !userId || staffOptions.length === 0}
                loading={assigning}
                loadingLabel="Adding…"
              >
                Add assignment
              </Button>
            </div>
          }
        >
          <ShiftAssignmentsSection
            userId={userId}
            onUserIdChange={(value) => {
              setUserId(value);
              setConstraintError(null);
            }}
            staffOptions={staffOptions}
            skills={skills}
            skillId={skillId}
            onSkillIdChange={setSkillId}
            overtime={overtime}
            overtimeLoading={overtimeLoading}
            overtimeError={overtimeError}
            overtimeOverrideReason={overtimeOverrideReason}
            onOverrideReasonChange={setOvertimeOverrideReason}
            constraintError={constraintError}
            error={assignmentError}
            assigning={assigning}
            onSubmit={handleAddAssignment}
            onSelectSuggestedUser={(id) => {
              setUserId(id);
              setConstraintError(null);
            }}
            hideHeading
            formId="add-assignment-form"
          />
        </Modal>
      )}

      {editDetailsOpen && (
        <Modal
          open
          onClose={() => !updatingShift && setEditDetailsOpen(false)}
          title="Edit shift details"
          maxWidth="xl"
          footer={
            <div className="flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => !updatingShift && setEditDetailsOpen(false)}
                className="text-ps-sm text-ps-fg-muted hover:bg-ps-surface-hover hover:text-ps-fg"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="edit-shift-form"
                variant="primary"
                disabled={updatingShift}
                loading={updatingShift}
                loadingLabel="Saving…"
                className="min-w-[130px] px-5 py-2.5"
              >
                Save changes
              </Button>
            </div>
          }
        >
          <ShiftForm
            locations={
              shift.location && locationsQuery.data?.locations
                ? locationsQuery.data.locations.filter((location) => location.id === shift.locationId)
                : []
            }
            locationId={shift.locationId}
            startDate={startDate}
            endDate={endDate}
            daysOfWeek={daysOfWeek}
            dailyStartTime={dailyStartTime}
            dailyEndTime={dailyEndTime}
            submitting={updatingShift}
            error={editError}
            onLocationChange={() => undefined}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onDaysOfWeekChange={setDaysOfWeek}
            onDailyStartTimeChange={setDailyStartTime}
            onDailyEndTimeChange={setDailyEndTime}
            onSubmit={handleUpdateShift}
            showSubmitButton={false}
            showLocationField={false}
            submitLabel="Save changes"
            submittingLabel="Saving…"
            formId="edit-shift-form"
          />
        </Modal>
      )}

      {confirmDeleteOpen && (
        <Modal
          open
          onClose={() => !deleting && setConfirmDeleteOpen(false)}
          title="Delete shift"
          maxWidth="sm"
          footer={
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => !deleting && setConfirmDeleteOpen(false)}
                className="font-normal text-ps-sm text-ps-fg-muted underline-offset-2 hover:underline"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={deleting}
                loading={deleting}
                loadingLabel="Deleting…"
                onClick={async () => {
                  if (deleting) return;
                  await handleDelete();
                }}
              >
                Delete shift
              </Button>
            </div>
          }
        >
          <p className="text-ps-sm text-ps-fg">
            Delete this shift permanently? This will also remove any assignments associated with it.
            This action cannot be undone.
          </p>
        </Modal>
      )}
    </div>
  );
}
