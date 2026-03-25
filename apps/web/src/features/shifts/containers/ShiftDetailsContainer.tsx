"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "@apollo/client";
import type { ShiftAttributes, SkillAttributes } from "@shiftsync/shared";

import { useAuth } from "@/lib/auth-context";
import { ShiftDetailsView } from "@/features/shifts/components/ShiftDetailsView";
import { ShiftAssignmentsSection } from "@/features/shifts/components/ShiftAssignmentsSection";
import { ShiftAuditTimeline } from "@/features/shifts/components/ShiftAuditTimeline";
import { ShiftAssignmentsTable } from "@/features/shifts/components/ShiftAssignmentsTable";
import { Modal } from "@/src/components/Modal";
import type { OvertimeWhatIf } from "@/features/shifts/types/OvertimeWhatIf";
import type { ConstraintError } from "@/features/shifts/types/ConstraintError";
import type { AuditEntry } from "@/features/shifts/types/AuditEntry";
import { UserRole } from "@shiftsync/shared";
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
} from "@/lib/apollo/operations";

type AddAssignmentResult = {
  assignment?: { id: string };
  constraintError?: ConstraintError;
};

export function ShiftDetailsContainer() {
  const params = useParams();
  const id = params.id as string;
  const { token, user } = useAuth();
  const [userId, setUserId] = useState("");
  const [skillId, setSkillId] = useState("");
  const [constraintError, setConstraintError] = useState<ConstraintError | null>(null);
  const [overtimeOverrideReason, setOvertimeOverrideReason] = useState("");
  const [publishError, setPublishError] = useState<string | null>(null);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [addAssignmentOpen, setAddAssignmentOpen] = useState(false);

  const shiftQuery = useQuery<{ shift: ShiftAttributes | null }>(SHIFT_QUERY, {
    variables: { id },
    skip: !token || !id,
  });
  console.log("shiftQuery", shiftQuery);
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
    skip: !token || !shift?.locationId || !skillId,
  });
  const historyQuery = useQuery<{ shiftHistory: AuditEntry[] }>(SHIFT_HISTORY_QUERY, {
    variables: { shiftId: id },
    skip: !token || !id,
  });
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
    skip: !token || !shift || !userId,
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
    try {
      await publishShift({ variables: { shiftId: shift.id } });
    } catch (err: unknown) {
      setPublishError((err as Error)?.message ?? "Unable to update publish status.");
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

  return (
    <div>
      <ShiftDetailsView
        shift={shift}
        onTogglePublish={handleTogglePublish}
        publishError={publishError}
        publishing={publishing}
        canDelete={user?.role === "Admin"}
        onDelete={() => setConfirmDeleteOpen(true)}
        deleting={deleting}
      />
      <ShiftAssignmentsTable
        assignments={shift.assignments ?? []}
        onAddAssignmentClick={() => {
          setAddAssignmentOpen(true);
        }}
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
              <button
                type="button"
                onClick={() => !assigning && setAddAssignmentOpen(false)}
                className="text-ps-sm text-ps-fg-muted underline-offset-2 hover:underline"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="add-assignment-form"
                disabled={assigning || !skillId || !userId || staffOptions.length === 0}
                className="inline-flex items-center justify-center rounded-ps bg-ps-primary px-4 py-2 text-sm font-semibold text-ps-primary-foreground shadow-ps transition-colors hover:bg-ps-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {assigning ? "Adding…" : "Add assignment"}
              </button>
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

      {confirmDeleteOpen && (
        <Modal
          open
          onClose={() => !deleting && setConfirmDeleteOpen(false)}
          title="Delete shift"
          maxWidth="sm"
          footer={
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => !deleting && setConfirmDeleteOpen(false)}
                className="text-ps-sm text-ps-fg-muted underline-offset-2 hover:underline"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (deleting) return;
                  await handleDelete();
                }}
                disabled={deleting}
                className="inline-flex items-center justify-center rounded-ps bg-ps-error px-4 py-2 text-sm font-semibold text-white shadow-ps transition-colors hover:bg-ps-error/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting ? "Deleting…" : "Delete shift"}
              </button>
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
