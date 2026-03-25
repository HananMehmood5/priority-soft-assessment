import Link from "next/link";
import type { ShiftAttributes } from "@shiftsync/shared";
import { Button } from "@/libs/ui/Button";
import { formatDate } from "@/lib/format-date";

type Props = {
  shift: ShiftAttributes;
  canEdit?: boolean;
  onEdit?: () => void;
  editing?: boolean;
  onTogglePublish?: () => void;
  publishing?: boolean;
  publishError?: string | null;
  canDelete?: boolean;
  onDelete?: () => void;
  deleting?: boolean;
};

export function ShiftDetailsView({
  shift,
  canEdit,
  onEdit,
  editing,
  onTogglePublish,
  publishing,
  publishError,
  canDelete,
  onDelete,
  deleting,
}: Props) {
  const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const daysLabel = [...shift.daysOfWeek]
    .sort((a, b) => a - b)
    .map((d) => weekdayLabels[d] ?? String(d))
    .join(", ");

  return (
    <div className="mb-8">
      <div className="mb-4">
        <Link
          href="/shifts"
          className="inline-flex items-center gap-1 text-ps-sm text-ps-fg-muted hover:text-ps-fg"
        >
          <span aria-hidden="true">←</span>
          <span>Back to shifts</span>
        </Link>
      </div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Shift details</h1>
          <p className="mt-1 text-ps-sm text-ps-fg-muted">
            Review the shift timing and status before assigning staff.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={[
              "inline-flex items-center rounded-full px-3 py-1 text-ps-xs font-medium",
              shift.published
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-ps-warning/10 text-ps-warning",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {shift.published ? "Published" : "Draft"}
          </span>
          <div className="flex items-center gap-2">
            {canEdit && onEdit && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={onEdit}
                loading={editing}
              >
                Edit details
              </Button>
            )}
            {!shift.published && onTogglePublish && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={onTogglePublish}
                loading={publishing}
              >
                Publish
              </Button>
            )}
            {canDelete && onDelete && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onDelete}
                loading={deleting}
                className="text-ps-error hover:text-ps-error hover:bg-ps-error/10"
              >
                Delete shift
              </Button>
            )}
          </div>
        </div>
      </div>
      <div className="rounded-ps border border-ps-border bg-ps-bg-card p-4">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-ps-xs uppercase tracking-wide text-ps-fg-muted">Location</dt>
            <dd className="mt-1 text-sm text-ps-fg break-all">{shift.location?.name}</dd>
          </div>
          <div>
            <dt className="text-ps-xs uppercase tracking-wide text-ps-fg-muted">Daily Schedule</dt>
            <dd className="mt-1 text-sm text-ps-fg">
              {shift.dailyStartTime}–{shift.dailyEndTime}
            </dd>
          </div>
          <div>
            <dt className="text-ps-xs uppercase tracking-wide text-ps-fg-muted">Start Day</dt>
            <dd className="mt-1 text-sm text-ps-fg">{formatDate(shift.startDate)}</dd>
          </div>
          <div>
            <dt className="text-ps-xs uppercase tracking-wide text-ps-fg-muted">End Day</dt>
            <dd className="mt-1 text-sm text-ps-fg">{formatDate(shift.endDate)}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-ps-xs uppercase tracking-wide text-ps-fg-muted">Working days</dt>
            <dd className="mt-1 text-sm text-ps-fg">{daysLabel}</dd>
          </div>
        </dl>
        {publishError && <p className="mt-3 text-ps-xs text-ps-error">{publishError}</p>}
      </div>
    </div>
  );
}
