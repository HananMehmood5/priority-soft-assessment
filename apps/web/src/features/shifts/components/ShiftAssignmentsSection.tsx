import { Input } from "@/libs/ui/Input";
import { Select } from "@/libs/ui/Select";
import { Button } from "@/libs/ui/Button";
import type { ConstraintError } from "@/features/shifts/types/ConstraintError";
import { OvertimeWhatIfPanel } from "@/features/shifts/components/OvertimeWhatIfPanel";
import type { OvertimeWhatIf } from "@/features/shifts/types/OvertimeWhatIf";

type SkillOption = { id: string; name: string };
type StaffOption = { id: string; name: string };

type Props = {
  userId: string;
  onUserIdChange: (value: string) => void;
  staffOptions?: StaffOption[];
  skills: SkillOption[];
  skillId: string;
  onSkillIdChange: (value: string) => void;
  overtime: OvertimeWhatIf | null;
  overtimeLoading: boolean;
  overtimeError: string | null;
  overtimeOverrideReason: string;
  onOverrideReasonChange: (value: string) => void;
  constraintError: ConstraintError | null;
  error: string | null;
  assigning: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onSelectSuggestedUser: (id: string) => void;
  /** When true, hides the section heading/description (useful inside modals). */
  hideHeading?: boolean;
  /** Optional form id to allow external submit buttons (e.g. modal footer). */
  formId?: string;
};

export function ShiftAssignmentsSection({
  userId,
  onUserIdChange,
  staffOptions = [],
  skills,
  skillId,
  onSkillIdChange,
  overtime,
  overtimeLoading,
  overtimeError,
  overtimeOverrideReason,
  onOverrideReasonChange,
  constraintError,
  error,
  assigning,
  onSubmit,
  onSelectSuggestedUser,
  hideHeading = false,
  formId,
}: Props) {
  return (
    <section className="mt-8">
      {!hideHeading && (
        <div className="mb-3">
          <h2 className="text-ps-lg font-semibold">Add assignment</h2>
          <p className="mt-1 text-ps-sm text-ps-fg-muted">
            Choose who will work this shift and at which skill. Overtime and rule
            warnings will appear automatically.
          </p>
        </div>
      )}
      <form
        id={formId}
        onSubmit={onSubmit}
        className="flex max-w-[480px] flex-col gap-4 rounded-ps border border-ps-border bg-ps-bg-card p-4"
      >
        <Select
          id="skillId"
          label="Skill"
          value={skillId}
          onChange={(e) => onSkillIdChange(e.target.value)}
        >
          {skills.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>

        {staffOptions.length > 0 ? (
          <Select
            id="userId"
            label="Staff"
            value={userId}
            onChange={(e) => onUserIdChange(e.target.value)}
          >
            <option value="">Select staff…</option>
            {staffOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        ) : (
          <p className="text-ps-sm text-ps-fg-muted">
            No staff are currently available for this skill at this location.
          </p>
        )}

        <OvertimeWhatIfPanel
          overtime={overtime}
          loading={overtimeLoading}
          error={overtimeError}
          overrideReason={overtimeOverrideReason}
          onOverrideReasonChange={onOverrideReasonChange}
        />

        {constraintError && (
          <div className="rounded-ps border border-ps-primary bg-ps-primary-muted p-3">
            <p className="mb-2 text-ps-warning">{constraintError.message}</p>
            {constraintError.alternatives?.length ? (
              <p className="m-0 text-ps-sm">
                Suggested staff:{" "}
                {constraintError.alternatives.map((a) => (
                  <Button
                    key={a.id}
                    type="button"
                    variant="secondary"
                    size="sm"
                    className=""
                    onClick={() => onSelectSuggestedUser(a.id)}
                  >
                    {a.name ?? a.id}
                  </Button>
                ))}
              </p>
            ) : null}
          </div>
        )}

        {error && <p className="m-0 text-ps-error">{error}</p>}
      </form>
    </section>
  );
}

