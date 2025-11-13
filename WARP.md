# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Commands

- Setup
  - Install all deps: `npm run install:all`
  - Initialize DB (SQLite): `cd backend && npm run db:init`
  - Reset DB with seed: `cd backend && npm run db:reset`

- Development
  - Run frontend + backend together: `npm run dev`
  - Backend only (nodemon): `cd backend && npm run dev`
  - Frontend only (Vite): `cd frontend && npm run dev`

- Tests
  - Frontend (Vitest): `cd frontend && npm run test`
  - Watch mode: `cd frontend && npm run test:watch`
  - Run a single test file: `cd frontend && npx vitest run src/components/__tests__/TaskRow.test.jsx`
  - Focus a single test by name: `cd frontend && npx vitest -t "calls API and notifies parent on successful save"`
  - Backend: no test suite configured (scripts are placeholders only)

- Build and preview
  - Build frontend: `npm run build` (runs `cd frontend && npm run build`)
  - Preview frontend build: `cd frontend && npm run preview`

- Docker
  - Build images: `npm run docker:build`
  - Start (prod-style, includes nginx): `npm run docker:up`
  - Stop: `npm run docker:down`
  - Logs (follow): `npm run docker:logs`
  - Dev with hot-reload: `npm run docker:dev` (or rebuild: `npm run docker:dev:build`)

- Health and smoke checks (backend)
  - API health: `cd backend && npm run test:health`
  - Auth flow (sample creds seeded by db:init): `cd backend && npm run test:auth`

- Troubleshooting quick refs
  - Vite cache reset: see README “Troubleshooting – Changes Not Appearing” (clear `frontend/node_modules/.vite` or run `npm run dev:fresh`)
  - LAN access: ensure frontend built with `VITE_API_URL` pointing to host IP; backend CORS must include that origin (see DEPLOYMENT.md)

## High-level architecture

Monorepo with a React/Vite SPA (frontend) and an Express/SQLite API (backend). Docker Compose supports both dev and prod-style runs.

- Frontend (React 18 + Vite)
  - HTTP client: `frontend/src/services/api.js` wraps axios, inserts JWT from `localStorage`, and exposes typed API surfaces: auth, projects, dashboard, calendar. Base URL comes from `VITE_API_URL` (falls back to `/api`).
  - UI domains (examples): `Dashboard.jsx` (executive KPIs + alerts, refresh every 30s), `WeeklyTrends.jsx` (time-series trends, S1–S4), `Projects.jsx` and `ProjectDetail.jsx` (CRUD/edit flows by role). Context providers: `AuthContext.jsx`, `ToastContext.jsx`.
  - Dev server: Vite at port 5173. In Docker dev, Vite is bound to `0.0.0.0` and proxies `/api` to the backend service.

- Backend (Node/Express + SQLite)
  - Entrypoint: `backend/server.js` configures CORS (origins from `CORS_ORIGIN` env), JSON body parsing, request logging, and mounts routes:
    - Auth: `routes/auth.js` (JWT login, /me)
    - Projects: `routes/projects.js` (CRUD; tasks CRUD nested; metrics)
    - Dashboard: `routes/dashboard.js` (KPIs, alerts, portfolio summary; 30s in-memory cache)
    - Calendar: `routes/calendar.js` (weekly snapshots and summaries)
  - Data access: `backend/database.js` opens SQLite with pragmatic settings (WAL, busy_timeout), creates/updates schema on startup, and exposes promisified helpers and transaction utilities.
  - Models (examples):
    - `models/Project.js` aggregates project + tasks in single SQL queries; provides metrics (weighted progress, delays) and transactional delete.
    - `models/Task.js`, `models/User.js`, `models/Alert.js`, `models/WeeklySnapshot.js` implement domain logic referenced by routes (access checks, alerts, weekly summaries).
  - Middleware: `middleware/auth.js` (JWT auth + role guard), `rateLimiter.js`, `validation.js` (express-validator), `requestLogger.js`, `activityLog.js`, centralized errors in `middleware/errorHandler.js`.

- Cross-cutting flows
  - AuthN/AuthZ: Frontend stores JWT in `localStorage`. Backend validates via `authenticateToken`; role/permission checks enforce CEO/CTO/Admin vs PM capabilities (e.g., PMs edit progress fields; Admin can perform full CRUD). PM visibility reduced to assigned projects.
  - Metrics and alerts: `routes/dashboard.js` computes KPIs/portfolio summaries from `Project` + `Task` data and caches results for 30 seconds to reduce load.
  - Weekly snapshots: `WeeklySnapshot` tables enable trends and calendar views; endpoints provide summaries and per-task snapshots.

- Configuration and environments
  - Frontend base URL: `VITE_API_URL` (e.g., `http://localhost:3001/api`). In Docker dev, Vite proxies `/api` to `http://backend:3001`.
  - Backend CORS: `CORS_ORIGIN` (comma-separated origins). Docker configs include localhost and typical LAN origins; adjust to match your environment.
  - Secrets and settings: `backend/.env` is loaded if present; in containers, prefer compose-provided envs.

- Docker topology
  - `docker-compose.yml` (prod-style): builds backend and frontend images, serves frontend via its container (and optional nginx proxy), persists DB under `backend/data`.
  - `docker-compose.dev.yml`: mounts source as volumes; `Dockerfile.dev` for hot-reload. Health checks rely on `wget` in the image.

## Notes distilled from README.md and DEPLOYMENT.md

- For LAN access, rebuild frontend with `VITE_API_URL` set to the host IP or serve both frontend and backend behind a reverse proxy to avoid CORS.
- Ensure backend `CORS_ORIGIN` includes every origin you will access the app from (localhost, 127.0.0.1, host IP with port 5173).
- Docker health checks use `wget`; Alpine images may need `apk add --no-cache wget` in Dockerfiles.
- `.env` files are not copied into images by default; in containers, rely on `docker-compose` environment values or mount `.env` explicitly.
