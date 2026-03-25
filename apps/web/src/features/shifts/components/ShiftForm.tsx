import { Select } from "@/libs/ui/Select";
import { Button } from "@/libs/ui/Button";
import type { LocationAttributes } from "@shiftsync/shared";

type Props = {
  locations: LocationAttributes[];
  locationId: string;
  startDate: string;
  endDate: string;
  daysOfWeek: number[];
  dailyStartTime: string;
  dailyEndTime: string;
  submitting: boolean;
  error: string | null;
  onLocationChange: (value: string) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onDaysOfWeekChange: (value: number[]) => void;
  onDailyStartTimeChange: (value: string) => void;
  onDailyEndTimeChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  showSubmitButton?: boolean;
  showLocationField?: boolean;
  submitLabel?: string;
  submittingLabel?: string;
  formId?: string;
};

export function ShiftForm({
  locations,
  locationId,
  startDate,
  endDate,
  daysOfWeek,
  dailyStartTime,
  dailyEndTime,
  submitting,
  error,
  onLocationChange,
  onStartDateChange,
  onEndDateChange,
  onDaysOfWeekChange,
  onDailyStartTimeChange,
  onDailyEndTimeChange,
  onSubmit,
  showSubmitButton = true,
  showLocationField = true,
  submitLabel = "Create shift",
  submittingLabel = "Creating…",
  formId,
}: Props) {
  const weekdayLabels = [
    { value: 0, label: "Sun" },
    { value: 1, label: "Mon" },
    { value: 2, label: "Tue" },
    { value: 3, label: "Wed" },
    { value: 4, label: "Thu" },
    { value: 5, label: "Fri" },
    { value: 6, label: "Sat" },
  ];

  const toggleDay = (day: number) => {
    const next = new Set(daysOfWeek);
    if (next.has(day)) {
      // Keep at least one weekday selected to avoid invalid templates.
      if (next.size <= 1) return;
      next.delete(day);
    } else {
      next.add(day);
    }
    onDaysOfWeekChange([...next].sort((a, b) => a - b));
  };

  const openNativePicker = (id: string) => {
    const input = document.getElementById(id) as HTMLInputElement | null;
    if (!input) return;
    input.focus();
    if (typeof input.showPicker === "function") {
      input.showPicker();
    }
  };

  return (
    <form
      id={formId}
      onSubmit={onSubmit}
      className="flex w-full max-w-none flex-col gap-6"
    >
      {showLocationField && (
        <Select
          id="location"
          label="Location"
          value={locationId}
          onChange={(e) => onLocationChange(e.target.value)}
          required
        >
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </Select>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="startDate" className="mb-1.5 block text-sm font-medium">
            Start date
          </label>
          <div className="relative">
            <input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              required
              className="w-full rounded-ps border border-ps-border bg-ps-bg-card px-3 py-2.5 pr-11 text-sm text-ps-fg focus:border-ps-border-focus focus:outline-none focus:ring-2 focus:ring-ps-border-focus [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:pointer-events-none"
            />
            <button
              type="button"
              onClick={() => openNativePicker("startDate")}
              className="absolute inset-y-1 right-1 inline-flex w-9 items-center justify-center rounded-ps text-ps-fg-muted transition-colors hover:bg-ps-surface-hover hover:text-ps-fg"
              aria-label="Open start date picker"
            >
              <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
                <rect x="3" y="4.5" width="14" height="12.5" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <path d="M3 8h14" stroke="currentColor" strokeWidth="1.5" />
                <path d="M7 3v3M13 3v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="endDate" className="mb-1.5 block text-sm font-medium">
            End date
          </label>
          <div className="relative">
            <input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              required
              className="w-full rounded-ps border border-ps-border bg-ps-bg-card px-3 py-2.5 pr-11 text-sm text-ps-fg focus:border-ps-border-focus focus:outline-none focus:ring-2 focus:ring-ps-border-focus [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:pointer-events-none"
            />
            <button
              type="button"
              onClick={() => openNativePicker("endDate")}
              className="absolute inset-y-1 right-1 inline-flex w-9 items-center justify-center rounded-ps text-ps-fg-muted transition-colors hover:bg-ps-surface-hover hover:text-ps-fg"
              aria-label="Open end date picker"
            >
              <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
                <rect x="3" y="4.5" width="14" height="12.5" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <path d="M3 8h14" stroke="currentColor" strokeWidth="1.5" />
                <path d="M7 3v3M13 3v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-ps border border-ps-border bg-ps-bg-card/30 p-4">
        <div className="mb-3">
          <p className="text-sm font-medium text-ps-fg">Days of week</p>
          <p className="mt-1 text-ps-xs text-ps-fg-muted">
            Select one or more days when this shift repeats.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {weekdayLabels.map((d) => {
            const checked = daysOfWeek.includes(d.value);
            const checkboxId = `dow-${d.value}`;
            return (
              <label
                key={d.value}
                htmlFor={checkboxId}
                className={[
                  "inline-flex min-w-[52px] cursor-pointer select-none items-center justify-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors",
                  checked
                    ? "border-ps-primary bg-ps-primary/15 text-ps-primary"
                    : "border-ps-border bg-ps-bg-card text-ps-fg-muted hover:border-ps-border-focus hover:text-ps-fg",
                ].join(" ")}
              >
                <input
                  id={checkboxId}
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleDay(d.value)}
                  className="sr-only"
                />
                <span>{d.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="dailyStartTime" className="mb-1.5 block text-sm font-medium">
            Daily start time
          </label>
          <div className="relative">
            <input
              id="dailyStartTime"
              type="time"
              step={300}
              value={dailyStartTime}
              onChange={(e) => onDailyStartTimeChange(e.target.value)}
              required
              className="w-full rounded-ps border border-ps-border bg-ps-bg-card px-3 py-2.5 pr-11 text-sm text-ps-fg focus:border-ps-border-focus focus:outline-none focus:ring-2 focus:ring-ps-border-focus [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:pointer-events-none"
            />
            <button
              type="button"
              onClick={() => openNativePicker("dailyStartTime")}
              className="absolute inset-y-1 right-1 inline-flex w-9 items-center justify-center rounded-ps text-ps-fg-muted transition-colors hover:bg-ps-surface-hover hover:text-ps-fg"
              aria-label="Open daily start time picker"
            >
              <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
                <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
                <path d="M10 6.5v4l2.75 1.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="dailyEndTime" className="mb-1.5 block text-sm font-medium">
            Daily end time
          </label>
          <div className="relative">
            <input
              id="dailyEndTime"
              type="time"
              step={300}
              value={dailyEndTime}
              onChange={(e) => onDailyEndTimeChange(e.target.value)}
              required
              className="w-full rounded-ps border border-ps-border bg-ps-bg-card px-3 py-2.5 pr-11 text-sm text-ps-fg focus:border-ps-border-focus focus:outline-none focus:ring-2 focus:ring-ps-border-focus [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:pointer-events-none"
            />
            <button
              type="button"
              onClick={() => openNativePicker("dailyEndTime")}
              className="absolute inset-y-1 right-1 inline-flex w-9 items-center justify-center rounded-ps text-ps-fg-muted transition-colors hover:bg-ps-surface-hover hover:text-ps-fg"
              aria-label="Open daily end time picker"
            >
              <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
                <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
                <path d="M10 6.5v4l2.75 1.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {error && <p className="m-0 text-ps-error">{error}</p>}

      {showSubmitButton && (
        <Button type="submit" variant="primary" loading={submitting}>
          {submitting ? submittingLabel : submitLabel}
        </Button>
      )}
    </form>
  );
}

