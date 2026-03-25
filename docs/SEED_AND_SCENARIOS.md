# Seed Data and Constraint Scenarios

## Running migrations and seed

1. Start Postgres from the repo root: `docker compose -f docker-compose.local.yml up -d`
2. From `apps/api`: `yarn migrate`
3. From `apps/api`: `yarn seed`

All users have password: **password123**.

- **Admin**: admin@coastaleats.com
- **Managers**: manager1@coastaleats.com (Downtown + Harbor), manager2@coastaleats.com (East + West)
- **Staff**: staff1@coastaleats.com … staff10@coastaleats.com (certifications and availability vary)

## Seed contents

- 4 locations: Coastal Eats Downtown, Harbor (America/Los_Angeles), East, West (America/New_York)
- Skills: bartender, line cook, server, host
- 2 managers, each 1–2 locations; 10 staff with staff_locations and staff_skills
- Desired hours and recurring availability for staff
- One published shift and two draft shifts (Downtown) with one assignment

## Steps to trigger constraints

1. **Double-book / duplicate**: Assigning the **same** staff **twice** to the **same** shift is rejected immediately (`Staff is already assigned to this shift.`). For **two different** overlapping shifts at the **same** location, the second `addAssignment` should return a double-book / overlap constraint when intervals overlap in UTC (same location timezone avoids false negatives).
2. **Rest (10h)**: Assign a staff to two shifts that are less than 10 hours apart; the second assignment should fail with a rest constraint message.
3. **Skill**: Assign a staff member who does not have the required skill (check `staff_skills`); assignment should fail with a skill constraint.
4. **Location**: Assign a staff member who is not certified at that location (`staff_locations`); assignment should fail.
5. **Availability**: Assign a staff member to a shift on a day/time outside their recurring availability (or inside an availability exception); assignment should fail with an availability message.
6. **Alternatives**: On any of the above failures, the response can include `alternatives` (eligible staff) when the API returns a constraint error with suggestions.

## Edge-case scenario: swap then manager edit

1. Staff A is assigned to Shift 1; Staff B to Shift 2.
2. Staff A creates a swap request (giving up Shift 1).
3. Staff B accepts the swap (offers Shift 2); request status becomes `accepted`.
4. Before manager approves, a manager edits Shift 1 (e.g. time change). The shifts service calls `cancelPendingByShiftId(shiftId)`, so the pending/accepted swap request for that assignment is cancelled. Affected users receive **persisted notifications** (and realtime events where the client is subscribed).
5. Manager approval is no longer possible for that request; original assignments remain.

No invalid double-bookings exist in the seed: the single assignment is to one shift only.
