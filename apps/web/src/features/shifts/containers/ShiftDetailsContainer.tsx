"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "@apollo/client";
import type { ShiftAttributes, SkillAttributes } from "@shiftsync/shared";

import { useAuth } from "@/lib/auth-context";
import { ShiftDetailsView } from "@/features/shifts/components/ShiftDetailsView";
import { ShiftAssignmentsSection } from "@/features/shifts/components/ShiftAssignmentsSection";
import { ShiftAuditTimeline } from "@/features/shifts/components/ShiftAuditTimeline";
import type { OvertimeWhatIf } from "@/features/shifts/types/OvertimeWhatIf";
import type { ConstraintError } from "@/features/shifts/types/ConstraintError";
import type { AuditEntry } from "@/features/shifts/types/AuditEntry";
import {
  SHIFT_QUERY,
  SKILLS_QUERY_MINIMAL,
  ADD_ASSIGNMENT_MUTATION,
  OVERTIME_WHAT_IF_QUERY,
  SHIFT_HISTORY_QUERY,
} from "@/lib/apollo/operations";

type AddAssignmentResult = {
  assignment?: { id: string };
  constraintError?: ConstraintError;
};

export function ShiftDetailsContainer() {
  const params = useParams();
  const id = params.id as string;
  const { token } = useAuth();
  const [userId, setUserId] = useState("");
  const [skillId, setSkillId] = useState("");
  const [constraintError, setConstraintError] = useState<ConstraintError | null>(
    null
  );
  const [overtimeOverrideReason, setOvertimeOverrideReason] = useState("");

  const shiftQuery = useQuery<{ shift: ShiftAttributes | null }>(SHIFT_QUERY, {
    variables: { id },
    skip: !token || !id,
  });
  const skillsQuery = useQuery<{ skills: Pick<SkillAttributes, "id" | "name">[] }>(
    SKILLS_QUERY_MINIMAL,
    { skip: !token }
  );
  const historyQuery = useQuery<{ shiftHistory: AuditEntry[] }>(
    SHIFT_HISTORY_QUERY,
    { variables: { shiftId: id }, skip: !token || !id }
  );

  const shift = shiftQuery.data?.shift ?? null;
  const skills = useMemo(
    () => skillsQuery.data?.skills ?? [],
    [skillsQuery.data?.skills]
  );

  const overtimeWhatIfQuery = useQuery<{ overtimeWhatIf: OvertimeWhatIf }>(
    OVERTIME_WHAT_IF_QUERY,
    {
      variables: shift && userId ? {
        userId,
        assignmentStart: shift.startAt,
        assignmentEnd: shift.endAt,
      } : undefined,
      skip: !token || !shift || !userId,
    }
  );

  const [addAssignment, { loading: assigning }] = useMutation<{
    addAssignment: AddAssignmentResult;
  }>(ADD_ASSIGNMENT_MUTATION, {
    refetchQueries: [{ query: SHIFT_QUERY, variables: { id } }, { query: SHIFT_HISTORY_QUERY, variables: { shiftId: id } }],
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
      }
    } catch {
      // error can be shown via mutation error state if needed
    }
  };

  const loading = shiftQuery.loading || skillsQuery.loading;
  const error = shiftQuery.error?.message ?? skillsQuery.error?.message ?? null;
  const history = historyQuery.data?.shiftHistory ?? [];
  const historyError = historyQuery.error?.message ?? null;
  const overtime = overtimeWhatIfQuery.data?.overtimeWhatIf ?? null;
  const overtimeLoading = overtimeWhatIfQuery.loading;
  const overtimeError = overtimeWhatIfQuery.error?.message ?? null;

  if (loading) return <p className="text-ps-fg-muted">Loading…</p>;
  if (error || !shift)
    return <p className="text-ps-error">{error ?? "Shift not found"}</p>;

  return (
    <div>
      <ShiftDetailsView shift={shift} />
      <ShiftAssignmentsSection
        userId={userId}
        onUserIdChange={(value) => {
          setUserId(value);
          setConstraintError(null);
        }}
        skills={skills}
        skillId={skillId}
        onSkillIdChange={setSkillId}
        overtime={overtime}
        overtimeLoading={overtimeLoading}
        overtimeError={overtimeError}
        overtimeOverrideReason={overtimeOverrideReason}
        onOverrideReasonChange={setOvertimeOverrideReason}
        constraintError={constraintError}
        error={null}
        assigning={assigning}
        onSubmit={handleAddAssignment}
        onSelectSuggestedUser={(id) => {
          setUserId(id);
          setConstraintError(null);
        }}
      />
      <ShiftAuditTimeline history={history} error={historyError} />
    </div>
  );
}
