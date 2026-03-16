import Link from "next/link";
import type { ShiftAttributes } from "@shiftsync/shared";
import { formatDateTime } from "@/lib/format-date";

type Props = {
  shift: ShiftAttributes;
};

export function ShiftDetailsView({ shift }: Props) {
  return (
    <div>
      <div className="mb-6">
        <Link
          href="/shifts"
          className="text-ps-sm text-ps-fg-muted"
        >
          ← Shifts
        </Link>
      </div>
      <h1 className="mb-2 text-2xl font-bold">
        Shift
      </h1>
      <div className="mb-6 rounded-ps border border-ps-border bg-ps-bg-card p-4">
        <p className="mb-1">
          <strong>Location ID:</strong> {shift.locationId}
        </p>
        <p className="mb-1">
          <strong>Start:</strong> {formatDateTime(shift.startAt)}
        </p>
        <p className="mb-1">
          <strong>End:</strong> {formatDateTime(shift.endAt)}
        </p>
        <p className="m-0">
          <strong>Published:</strong> {shift.published ? "Yes" : "No"}
        </p>
      </div>
    </div>
  );
}

