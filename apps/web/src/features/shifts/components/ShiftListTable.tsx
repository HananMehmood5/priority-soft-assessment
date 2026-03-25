import Link from "next/link";
import type { ShiftAttributes, LocationAttributes } from "@shiftsync/shared";
import { Table } from "@/libs/ui/Table/Table";

type Props = {
  shifts: ShiftAttributes[];
  locations: LocationAttributes[];
};

export function ShiftListTable({ shifts, locations }: Props) {
  const locationName = (id: string) =>
    locations.find((l) => l.id === id)?.name ?? id;
  const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const daysLabel = (days: number[]) =>
    [...days]
      .sort((a, b) => a - b)
      .map((d) => weekdayLabels[d] ?? String(d))
      .join(", ");

  return (
    <Table<ShiftAttributes>
      data={shifts}
      emptyMessage="No shifts. Create one to get started."
      columns={[
        {
          header: "Location",
          render: (row) => <span className="text-sm text-ps-fg">{locationName(row.locationId)}</span>,
        },
        {
          header: "Start time",
          render: (row) => <span className="text-sm text-ps-fg">{row.dailyStartTime}</span>,
        },
        {
          header: "End time",
          render: (row) => <span className="text-sm text-ps-fg">{row.dailyEndTime}</span>,
        },
        {
          header: "Start date",
          render: (row) => <span className="text-sm text-ps-fg">{row.startDate}</span>,
        },
        {
          header: "End date",
          render: (row) => <span className="text-sm text-ps-fg">{row.endDate}</span>,
        },
        {
          header: "Days",
          render: (row) => <span className="text-sm text-ps-fg">{daysLabel(row.daysOfWeek)}</span>,
        },
        {
          header: "Published",
          render: (row) => <span className="text-sm text-ps-fg">{row.published ? "Yes" : "No"}</span>,
        },
        {
          header: "",
          render: (row) => (
            <Link href={`/shifts/${row.id}`} className="text-ps-primary">
              View
            </Link>
          ),
          className: "w-24",
        },
      ]}
      getRowId={(row) => row.id}
    />
  );
}

