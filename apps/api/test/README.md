# E2E Tests

Run against a test database. **Migrations and seed run automatically** before any test (via Jest `globalSetup`), so tests are self-contained and always have the data they need (e.g. `admin@coastaleats.com` / `password123`).

## Suites

- **auth** — login (success, wrong password, validation), register (Admin success, non-Admin forbidden)
- **health** — GET /health
- **locations** — query locations with/without token
- **skills** — query skills, createSkill as Admin
- **shifts** — query shifts as manager, createShift
- **requests** — myRequests, pendingRequests, createSwapRequest (invalid id)
- **notifications** — notifications list, notificationPreferences
- **audit** — shiftHistory (manager), auditExport (admin, manager forbidden)
- **reports** — reportDistribution, reportPremiumFairness, reportDesiredHours
- **overtime** — overtimeWhatIf, overtimeDashboard (manager)

## Setup

1. Use a dedicated test database and set `DATABASE_URL` in `apps/api/.env` (or `.env.test`) to that database. The database must exist; migrations will create tables and seed will insert users/locations/etc.
2. From `apps/api`: run e2e. Migrate and seed run once before all tests.

```bash
cd apps/api
yarn test:e2e
```

Seed users (password `password123`): `admin@coastaleats.com`, `manager1@coastaleats.com`, `staff1@coastaleats.com`, etc.
