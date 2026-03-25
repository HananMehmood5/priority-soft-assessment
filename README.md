# ShiftSync

Multi-location staff scheduling platform for Coastal Eats (Priority Soft assessment).

## Stack

- **Monorepo**: Yarn workspaces
- **Backend**: NestJS (TypeScript), Sequelize, PostgreSQL, WebSocket (Socket.io)
- **Frontend**: Next.js (App Router), React, TypeScript
- **Local DB**: PostgreSQL 15 via Docker Compose

## Prerequisites

- Node.js 22+
- Yarn 1.x
- Docker and Docker Compose

## Local setup

For full evaluator-focused local setup (including test accounts and scenarios), see `docs/README.md`.

### 1. Start the database

```bash
docker compose -f docker-compose.local.yml up -d
```

PostgreSQL runs on host `localhost:5440` (container port 5432). Default DB: `shiftsync`, user: `shiftsync`, password: `shiftsync`.

### 2. Environment

Copy the example env and adjust if needed:

```bash
cp .env.example .env
```

### 3. Install dependencies

From the repo root:

```bash
yarn install
```

### 4. Run the apps

- **API** (NestJS): `yarn api:dev` or `yarn workspace api dev` — default `http://localhost:3001`
- **Web** (Next.js): `yarn web:dev` or `yarn workspace web dev` — default `http://localhost:3000`

(API and web run on the host; they use `DATABASE_URL` from `.env` to connect to the Docker Postgres.)

**Real-time**: The API serves WebSocket (Socket.io) on the same host and port as HTTP. Set `WS_URL` / `NEXT_PUBLIC_WS_URL` in `.env` so the web app can subscribe to schedule and notification events.

## Deployment (summary)

See `docs/ASSUMPTIONS_AND_DECISIONS.md` for full deployment assumptions.

- **Backend (Railway)**:
  - Build: `yarn build:api`
  - Start: `yarn start`
  - Env: `DATABASE_URL`, `JWT_SECRET`, `PORT` (injected by Railway), `CORS_ORIGIN`.

- **Frontend (Vercel)**:
  - Build: `yarn workspace web build`
  - Env: `NEXT_PUBLIC_GRAPHQL_URL`, `NEXT_PUBLIC_WS_URL`.

## Submission checklist

Send the hiring contact what they asked for (typically **live URL**, **repo access**, **this codebase**, and **documentation**). Before you send:

- **Live app URL**: insert your deployed web URL (and confirm API + WebSocket URLs in Vercel/Railway env).
- **Role credentials**: `docs/SEED_AND_SCENARIOS.md` (production DB should be migrated + seeded if evaluators use seeded accounts).
- **Evaluator walkthrough**: `docs/README.md` (run, proof checklist, limitations).
- **Assumptions / ambiguous brief items**: `docs/ASSUMPTIONS_AND_DECISIONS.md`.
- **Original assessment PDF/spec**: not committed in this repo—keep your own copy; submission is this implementation + docs above.

## Verification commands

Run from repo root (except where noted):

```bash
yarn lint
yarn api:build
yarn web:build
cd apps/api && CI=true yarn test:e2e
yarn web:test
```

Expected result before submission: all commands exit successfully with no failing tests (use `CI=true` for e2e if watchman causes issues locally).

## Feature coverage (assessment scope)

| Requirement area | Status | Notes |
| --- | --- | --- |
| User management & roles | Implemented | Admin/Manager/Staff + location/skill certifications and scoped access |
| Shift scheduling + constraints | Implemented | Assignment constraints, overlap checks, and conflict feedback are enforced |
| Shift swapping & coverage | Implemented | Swap/drop acceptance/approval flow with limits and expiry |
| Overtime & labor warnings | Implemented | Overtime dashboard, what-if calculations, warning/block rules |
| Fairness analytics | Implemented | Distribution, premium fairness, desired-vs-actual reports |
| Real-time features | Implemented | Socket.io update events for schedule/request changes and on-duty views |
| Notifications | Mostly implemented | In-app notification center + realtime push; GraphQL for preferences exists, **no settings UI**; **email simulation** not implemented |
| Calendar/time handling | Implemented (location TZ) | Calendar expands shifts in each shift’s **location** timezone (`apps/web/lib/calendar-location-time.ts`); per-user TZ prefs and exhaustive DST fixtures deferred |
| Audit trail | Implemented | Shift history and audit logging available |

## Project layout

- `apps/api` — NestJS GraphQL API + Socket.io (same port as HTTP)
- `apps/web` — Next.js App Router frontend
- `docs/README.md` — evaluator-facing runbook + proof checklist
- `docs/ASSUMPTIONS_AND_DECISIONS.md` — ambiguous-brief decisions + deployment notes
- `docs/SEED_AND_SCENARIOS.md` — test accounts and manual scenarios
- `docs/REPOSITORY_PATTERN.md` — API data-access conventions
- `docs/THEMING.md` — frontend visual tokens and components
