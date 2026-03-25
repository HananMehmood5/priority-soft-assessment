# ShiftSync – Assumptions and Decisions

This document captures key assumptions and explicit decisions made where the assessment brief left room for interpretation.

## De-certification

- **Assumption**: Staff can be “de-certified” (i.e. lose a skill) without deleting their historical shifts.
- **Decision**:
  - Existing shifts in the past remain valid even if a staff member is later de-certified for a skill.
  - Future shifts that require a skill the staff member no longer has will surface as **constraint violations** and should be corrected by a manager (e.g. by reassigning the shift).
  - The UI favors surfacing these violations in approvals / shift details rather than silently auto-fixing them.
- **Impact**: preserves historical integrity while making future scheduling issues explicit to managers.
- **Risk**: managers may temporarily see invalid future assignments after certification changes.
- **Mitigation / next step**: add proactive alerts and one-click reassignment actions in a future iteration.

## Desired hours

- **Assumption**: Each staff member has a notion of “desired hours per week” used for fairness.
- **Decision**:
  - Desired hours are treated as a **soft target**, not a hard constraint.
  - The fairness views use desired hours vs. assigned hours to show under‑ and over‑scheduled staff.
  - Scheduling logic does not outright block a shift if it slightly exceeds desired hours; instead, it flags this as a fairness issue.
- **Impact**: managers can still staff urgent shifts while seeing fairness pressure.
- **Risk**: persistent over-scheduling can happen if warnings are ignored.
- **Mitigation / next step**: add configurable escalation thresholds and manager nudges for repeated violations.

## Consecutive days

- **Assumption**: There is a maximum number of consecutive days a staff member should work before a rest day.
- **Decision**:
  - Consecutive days are defined per calendar day in the deployment timezone.
  - Exceeding the configured threshold generates a **constraint warning** rather than a hard error so managers can still override in exceptional circumstances.
  - Fairness views can highlight staff with systematically excessive consecutive-day streaks.
- **Impact**: supports operational flexibility while keeping labor-risk visibility.
- **Risk**: warning-only handling may allow risky schedules under pressure.
- **Mitigation / next step**: configurable policy to require explicit override reason at lower thresholds.

## Swap after edit

- **Assumption**: Shifts can be edited (time, role, location) after they have been requested for swap or drop.
- **Decision**:
  - If a manager or admin significantly edits a shift (time window, required skill, or location), **pending swap/drop requests on that shift are invalidated** and should be re-requested.
  - Minor metadata changes (e.g. description) do not invalidate requests.
  - The intent is to avoid “bait-and-switch” where a staff member agrees to a swap that later changes materially.
- **Impact**: protects staff consent from stale or materially changed shift context.
- **Risk**: extra operational churn when managers make frequent edits.
- **Mitigation / next step**: add clearer in-app messaging and suggested re-request actions after invalidation.

## Shift timing model (template-based)

- **Assumption**: Managers often schedule the same hours across a date range (e.g., “10:00–17:00 from Mar 17 to Mar 31”), and overtime/double-booking should be evaluated against the actual daily hours rather than treating the range as one continuous block.
- **Decision**:
  - A shift stores **only** `startDate`, `endDate`, `dailyStartTime`, and `dailyEndTime`.
  - All time-based logic (constraints, overtime, on-duty, reports) **derives per-day concrete intervals** from that template.
  - Overnight patterns are supported by allowing `dailyEndTime <= dailyStartTime`, meaning the interval ends the following day.
- **Impact**: simpler data model with consistent derived-time behavior across features.
- **Risk**: more complex edge handling around DST and unusual timezone boundaries.
- **Mitigation / next step**: expand regression tests around DST and add per-location timezone fixtures.

## Shift required skill + headcount interpretation

- **Decision (current implementation)**:
  - Each **shift** row includes **`requiredSkillId`** and **`headcountNeeded`** (see `shifts` table and GraphQL `CreateShiftInput`).
  - Each **assignment** carries **`skillId`**; the API enforces compatibility with the shift’s required skill for normal assignments and caps total assignments at **`headcountNeeded`**.
  - A **duplicate assignment** for the same `(shiftId, userId)` is rejected with a clear error (`Staff is already assigned to this shift.`) in addition to interval-based double-book checks.
- **Impact**: aligns with the brief’s “required skill + headcount” while keeping assignment-level `skillId` for auditing and future mixed-skill extensions if ever needed.

## Timezones (implemented vs deferred)

- **Implemented (assessment)**:
  - Each **location** carries an IANA timezone (`locations.timezone`).
  - **Backend** derived intervals for constraints, overtime, on-duty, premium/fairness reporting, and drop expiry use **location timezone** when expanding template shifts to concrete intervals (see `getShiftTimeZone` / `expandShiftToIntervals` with `date-fns-tz`).
  - **API** still stores timestamps in UTC; clients display local/decoded times as today.
- **Deferred / out of scope**:
  - **Per-user timezone preferences** (e.g. a manager traveling who wants all views in their home TZ).
  - Full **cross-timezone** semantics for availability exceptions and “what day is it?” for a user who lives in a different TZ than the shift’s location (beyond using the shift’s location TZ for interval math).
  - Exhaustive **DST regression fixtures** (called out as a follow-up in tests/docs).
- **Web calendar**: shift occurrences are expanded with **`date-fns-tz`** so displayed times match each shift’s **location** timezone (`apps/web/lib/calendar-location-time.ts`), not the browser’s local zone for slot math.

## Deployment and environments

- **Backend on Railway**
  - Uses Node + Yarn workspaces (no Dockerfile required).
  - Railway is configured with:
    - Build command: `yarn api:build`
    - Start command: `yarn api:start`.
    - Env:
      - `DATABASE_URL`: Railway PostgreSQL URL or external Postgres.
      - `JWT_SECRET`: strong secret.
      - `CORS_ORIGIN`: e.g. `https://shiftsync.vercel.app`.
  - WebSocket (Socket.io) runs on the same origin and port as HTTP.

- **Frontend on Vercel**
  - Uses the Next.js App Router deployment (see repo `engines` / `package.json` for current major version).
  - Env:
    - `NEXT_PUBLIC_GRAPHQL_URL` – GraphQL endpoint on the Railway API (`/graphql`).
    - `NEXT_PUBLIC_WS_URL` – WebSocket base URL (e.g. `wss://<railway-api>.up.railway.app`).
  - No custom server or API routes are required in Vercel; the frontend talks directly to the Railway backend.

- **Seeding production**
  - Seeds are run against the production database manually.
  - Set `DATABASE_URL` to the production Postgres URL.
  - Run migrations + seeds from the `apps/api` workspace:

```bash
cd apps/api
yarn migrate
yarn seed
```

This is intentionally a manual, explicit step to avoid accidental reseeding during normal deploys.

## Repository contents vs hiring package

- **Included for reviewers**: application source, migrations, seeds, tests, and documentation under `docs/` plus root `README.md`.
- **Excluded by design**: the original assessment specification file is **not** stored in this repository (submit the implementation + these docs per the employer’s instructions).
- **Local IDE metadata**: `.cursor/plans/` is listed in `.gitignore`; do not attach Cursor plan folders when zipping the project for submission.
