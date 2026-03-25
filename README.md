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

**Real-time**: The API serves WebSocket (Socket.io) on the same host and port as HTTP. Set `WS_URL` in `.env` (e.g. `ws://localhost:3001`) for the frontend to connect for real-time updates (Phase 2+).

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

- **Live app URL**: add deployed URL before submission (TBD in local-only review state).
- **Role credentials**: see `docs/SEED_AND_SCENARIOS.md`.
- **Evaluator walkthrough**: see `docs/README.md`.
- **Assumptions/tradeoffs**: see `docs/ASSUMPTIONS_AND_DECISIONS.md`.

## Verification commands

Run from repo root (except where noted):

```bash
yarn lint
yarn api:build
yarn web:build
cd apps/api && yarn test:e2e
```

Expected result before submission: all commands exit successfully with no failing tests.

## Requirement coverage (mapped to `requirements.md`)

| Requirement area | Status | Notes |
| --- | --- | --- |
| User management & roles | Implemented | Admin/Manager/Staff + location/skill certifications and scoped access |
| Shift scheduling + constraints | Implemented | Assignment constraints, overlap checks, and conflict feedback are enforced |
| Shift swapping & coverage | Implemented | Swap/drop acceptance/approval flow with limits and expiry |
| Overtime & labor warnings | Implemented | Overtime dashboard, what-if calculations, warning/block rules |
| Fairness analytics | Implemented | Distribution, premium fairness, desired-vs-actual reports |
| Real-time features | Implemented | Socket.io update events for schedule/request changes and on-duty views |
| Notifications | Implemented | In-app notifications and preference handling |
| Calendar/time handling | Partial | Overnight shifts supported; broad multi-timezone edge behavior is documented as out of scope |
| Audit trail | Implemented | Shift history and audit logging available |

## Project layout

- `apps/api` — NestJS backend (Sequelize, REST + Socket.io WebSocket; events/rooms in Phase 2)
- `apps/web` — Next.js frontend
- `docs/README.md` — evaluator-facing run + usage instructions
- `docs/ASSUMPTIONS_AND_DECISIONS.md` — key product/technical decisions and deployment assumptions
