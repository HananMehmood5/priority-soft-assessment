import { render, screen } from "@testing-library/react";
import type { LocationAttributes, ShiftAssignmentAttributes, ShiftAttributes } from "@shiftsync/shared";
import { ShiftListTable } from "../ShiftListTable";
import { ShiftAssignmentsTable } from "../ShiftAssignmentsTable";

describe("Shift display formatting", () => {
  test("renders date-only ranges without timezone day shifts", () => {
    const shifts: ShiftAttributes[] = [
      {
        id: "shift-1",
        locationId: "loc-1",
        startDate: "2026-01-02",
        endDate: "2026-01-02",
        daysOfWeek: [5],
        dailyStartTime: "09:00",
        dailyEndTime: "17:00",
        published: false,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ];
    const locations: LocationAttributes[] = [
      {
        id: "loc-1",
        name: "Downtown",
        timezone: "America/New_York",
      },
    ];

    render(<ShiftListTable shifts={shifts} locations={locations} />);

    expect(screen.getByText("Jan 2, 2026")).toBeInTheDocument();
  });

  test("shows stable fallback when assignment user details are missing", () => {
    const assignments: ShiftAssignmentAttributes[] = [
      {
        id: "assign-1",
        shiftId: "shift-1",
        userId: "12345678-1111-2222-3333-444444444444",
        skillId: "skill-1",
        version: 1,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        overtimeOverrideReason: null,
      },
    ];

    render(<ShiftAssignmentsTable assignments={assignments} />);

    expect(screen.getByText("User 12345678")).toBeInTheDocument();
    expect(screen.queryByText(/undefined/i)).not.toBeInTheDocument();
  });
});
