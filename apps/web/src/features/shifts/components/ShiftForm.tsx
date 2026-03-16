import { Input } from "@/libs/ui/Input";
import { Select } from "@/libs/ui/Select";
import { Button } from "@/libs/ui/Button";
import type { LocationAttributes } from "@shiftsync/shared";

type Props = {
  locations: LocationAttributes[];
  locationId: string;
  startAt: string;
  endAt: string;
  submitting: boolean;
  error: string | null;
  onLocationChange: (value: string) => void;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
};

export function ShiftForm({
  locations,
  locationId,
  startAt,
  endAt,
  submitting,
  error,
  onLocationChange,
  onStartChange,
  onEndChange,
  onSubmit,
}: Props) {
  return (
    <form onSubmit={onSubmit} className="flex max-w-[400px] flex-col gap-4">
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

      <Input
        id="startAt"
        label="Start"
        type="datetime-local"
        value={startAt}
        onChange={(e) => onStartChange(e.target.value)}
        required
      />

      <Input
        id="endAt"
        label="End"
        type="datetime-local"
        value={endAt}
        onChange={(e) => onEndChange(e.target.value)}
        required
      />

      {error && <p className="m-0 text-ps-error">{error}</p>}

      <Button type="submit" variant="primary" loading={submitting}>
        {submitting ? "Creating…" : "Create shift"}
      </Button>
    </form>
  );
}

