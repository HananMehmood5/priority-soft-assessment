import type { OvertimeWhatIf } from "@/features/shifts/types/OvertimeWhatIf";

type Props = {
  overtime: OvertimeWhatIf | null;
  loading: boolean;
  error: string | null;
  overrideReason: string;
  onOverrideReasonChange: (value: string) => void;
};

export function OvertimeWhatIfPanel({
  overtime,
  loading,
  error,
  overrideReason,
  onOverrideReasonChange,
}: Props) {
  const showOverride =
    overtime &&
    overtime.consecutiveRequireOverride &&
    !overtime.weeklyBlock &&
    !overtime.dailyBlock;

  return (
    <>
      {overtime && (
        <div
          className={`rounded-ps border border-ps-border p-3 ${
            overtime.canAssign ? "bg-ps-bg-card" : "bg-ps-primary-muted"
          }`}
        >
          <p
            className={`mb-1 text-ps-sm ${
              overtime.canAssign ? "text-ps-fg-muted" : "text-ps-warning"
            }`}
          >
            {overtime.message ??
              `Projected weekly hours: ${overtime.projectedWeeklyHours.toFixed(
                1
              )}h. Projected daily hours: ${overtime.projectedDailyHours.toFixed(
                1
              )}h.`}
          </p>
          {!overtime.canAssign && (
            <p className="m-0 text-ps-xs text-ps-warning">
              This assignment cannot be saved unless overtime conditions are
              resolved.
            </p>
          )}
        </div>
      )}
      {loading && (
        <p
          className="text-ps-xs text-ps-fg-muted"
        >
          Checking overtime…
        </p>
      )}
      {error && <p className="m-0 text-ps-xs text-ps-error">{error}</p>}
      {showOverride && (
        <div>
          <label
            htmlFor="overtimeOverrideReason"
            className="mb-1.5 block font-medium"
          >
            Overtime override reason (required for 7th consecutive day)
          </label>
          <textarea
            id="overtimeOverrideReason"
            value={overrideReason}
            onChange={(e) => onOverrideReasonChange(e.target.value)}
            rows={3}
            className="w-full resize-y rounded-ps border border-ps-border bg-ps-bg-card px-3 py-2.5 text-sm text-ps-fg outline-none focus:border-ps-border-focus focus:ring-2 focus:ring-ps-border-focus"
            placeholder="Document why this overtime assignment is necessary…"
          />
        </div>
      )}
    </>
  );
}

