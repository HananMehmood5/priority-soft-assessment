import Link from "next/link";
import type { ShiftAttributes, LocationAttributes } from "@shiftsync/shared";

type Props = {
  shifts: ShiftAttributes[];
  locations: LocationAttributes[];
};

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatTime(time: string): string {
  const [hoursPart, minutesPart] = time.split(":");
  const hours = Number(hoursPart);
  const minutes = Number(minutesPart);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return time;
  const hour12 = hours % 12 || 12;
  const suffix = hours >= 12 ? "PM" : "AM";
  return `${hour12}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return `${startDate} - ${endDate}`;
  }

  const fullDate = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const monthDay = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  });

  return startDate === endDate
    ? fullDate.format(start)
    : `${monthDay.format(start)} - ${fullDate.format(end)}`;
}

export function ShiftListTable({ shifts, locations }: Props) {
  const locationName = (id: string) =>
    locations.find((l) => l.id === id)?.name ?? id;

  const daysLabel = (days: number[]) =>
    [...days]
      .sort((a, b) => a - b)
      .map((d) => weekdayLabels[d] ?? String(d))
      .join(", ");

  if (shifts.length === 0) {
    return (
      <div className="rounded-ps border border-dashed border-ps-border p-8 text-center text-sm text-ps-fg-muted">
        No shifts. Create one to get started.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {shifts.map((shift) => (
        <article
          key={shift.id}
          className="rounded-ps border border-ps-border bg-ps-bg-card p-4"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold text-ps-fg">
                {locationName(shift.locationId)}
              </h3>
              <p className="mt-1 text-sm text-ps-fg-muted">
                {formatTime(shift.dailyStartTime)} - {formatTime(shift.dailyEndTime)}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium ${
                shift.published
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                  : "border-amber-500/40 bg-amber-500/10 text-amber-300"
              }`}
            >
              {shift.published ? "Published" : "Draft"}
            </span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_2fr_auto] lg:items-end">
            <div>
              <p className="text-xs uppercase tracking-wide text-ps-fg-muted">Date range</p>
              <p className="mt-1 text-sm text-ps-fg">
                {formatDateRange(shift.startDate, shift.endDate)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-ps-fg-muted">Days</p>
              <p className="mt-1 text-sm text-ps-fg">{daysLabel(shift.daysOfWeek)}</p>
            </div>
            <div className="lg:text-right">
              <Link
                href={`/shifts/${shift.id}`}
                className="inline-flex items-center justify-center rounded-ps border border-ps-border px-3 py-2 text-sm font-medium text-ps-primary transition-colors hover:bg-ps-bg"
              >
                View details
              </Link>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

