import { Input } from "@/libs/ui/Input";
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

  return (
    <form
      id={formId}
      onSubmit={onSubmit}
      className="flex max-w-[400px] flex-col gap-4"
    >
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          id="startDate"
          label="Start date"
          type="date"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          id="endDate"
          label="End date"
          type="date"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          required
        />
      </div>

      <div>
        <div className="mb-1 text-sm font-medium">Days of week</div>
        <div className="grid grid-cols-7 gap-2">
          {weekdayLabels.map((d) => {
            const checked = daysOfWeek.includes(d.value);
            const checkboxId = `dow-${d.value}`;
            return (
              <label
                key={d.value}
                htmlFor={checkboxId}
                className={[
                  "flex cursor-pointer select-none items-center justify-center gap-2 rounded-ps border px-2 py-1 text-xs",
                  checked ? "border-ps-primary bg-ps-primary/10 text-ps-primary" : "border-ps-border bg-ps-bg-card text-ps-fg-muted",
                ].join(" ")}
              >
                <input
                  id={checkboxId}
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleDay(d.value)}
                  className="h-4 w-4 accent-ps-primary"
                />
                <span>{d.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          id="dailyStartTime"
          label="Daily start time"
          type="time"
          value={dailyStartTime}
          onChange={(e) => onDailyStartTimeChange(e.target.value)}
          required
        />
        <Input
          id="dailyEndTime"
          label="Daily end time"
          type="time"
          value={dailyEndTime}
          onChange={(e) => onDailyEndTimeChange(e.target.value)}
          required
        />
      </div>

      {error && <p className="m-0 text-ps-error">{error}</p>}

      {showSubmitButton && (
        <Button type="submit" variant="primary" loading={submitting}>
          {submitting ? "Creating…" : "Create shift"}
        </Button>
      )}
    </form>
  );
}

