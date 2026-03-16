# ShiftSync

Multi-location staff scheduling platform for Coastal Eats (Priority Soft assessment).

## Stack

- **Monorepo**: Yarn workspaces
- **Backend**: NestJS (TypeScript), Sequelize, PostgreSQL, WebSocket (Socket.io)
- **Frontend**: Next.js (App Router), React, TypeScript
- **Local DB**: PostgreSQL 15 via Docker Compose

## Prerequisites

- Node.js 18+
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

- **API** (NestJS): `yarn api:dev` or `yarn workspace api dev` — default http://localhost:3001
- **Web** (Next.js): `yarn web:dev` or `yarn workspace web dev` — default http://localhost:3000

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

## Project layout

- `apps/api` — NestJS backend (Sequelize, REST + Socket.io WebSocket; events/rooms in Phase 2)
- `apps/web` — Next.js frontend
- `docs/README.md` — evaluator-facing run + usage instructions
- `docs/ASSUMPTIONS_AND_DECISIONS.md` — key product/technical decisions and deployment assumptions
