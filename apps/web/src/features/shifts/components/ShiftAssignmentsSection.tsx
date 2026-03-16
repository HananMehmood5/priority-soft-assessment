import { Input } from "@/libs/ui/Input";
import { Select } from "@/libs/ui/Select";
import { Button } from "@/libs/ui/Button";
import type { ConstraintError } from "@/features/shifts/types/ConstraintError";
import { OvertimeWhatIfPanel } from "@/features/shifts/components/OvertimeWhatIfPanel";
import type { OvertimeWhatIf } from "@/features/shifts/types/OvertimeWhatIf";

type SkillOption = { id: string; name: string };

type Props = {
  userId: string;
  onUserIdChange: (value: string) => void;
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
};

export function ShiftAssignmentsSection({
  userId,
  onUserIdChange,
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
}: Props) {
  return (
    <section>
      <h2 className="mb-3 text-ps-lg font-semibold">Add assignment</h2>
      <form onSubmit={onSubmit} className="flex max-w-[400px] flex-col gap-4">
        <Input
          id="userId"
          label="Staff user ID (UUID)"
          value={userId}
          onChange={(e) => onUserIdChange(e.target.value)}
          placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
        />

        <OvertimeWhatIfPanel
          overtime={overtime}
          loading={overtimeLoading}
          error={overtimeError}
          overrideReason={overtimeOverrideReason}
          onOverrideReasonChange={onOverrideReasonChange}
        />

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

        <Button type="submit" variant="primary" loading={assigning}>
          {assigning ? "Adding…" : "Add assignment"}
        </Button>
      </form>
    </section>
  );
}

