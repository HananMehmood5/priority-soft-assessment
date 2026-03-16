import Link from "next/link";
import type { ShiftAttributes, LocationAttributes } from "@shiftsync/shared";
import { formatDateTime } from "@/lib/format-date";
import { Table, Th, Tr, Td } from "@/libs/ui/Table";

type Props = {
  shifts: ShiftAttributes[];
  locations: LocationAttributes[];
};

export function ShiftListTable({ shifts, locations }: Props) {
  const locationName = (id: string) =>
    locations.find((l) => l.id === id)?.name ?? id;

  if (shifts.length === 0) {
    return (
      <p className="text-ps-fg-muted">No shifts. Create one to get started.</p>
    );
  }

  return (
    <Table>
      <thead>
        <tr>
          <Th>Location</Th>
          <Th>Start</Th>
          <Th>End</Th>
          <Th>Published</Th>
          <Th></Th>
        </tr>
      </thead>
      <tbody>
        {shifts.map((s) => (
          <Tr key={s.id}>
            <Td>{locationName(s.locationId)}</Td>
            <Td>{formatDateTime(s.startAt)}</Td>
            <Td>{formatDateTime(s.endAt)}</Td>
            <Td>{s.published ? "Yes" : "No"}</Td>
            <Td>
              <Link href={`/shifts/${s.id}`} className="text-ps-primary">
                View
              </Link>
            </Td>
          </Tr>
        ))}
      </tbody>
    </Table>
  );
}

