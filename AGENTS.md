# MuslimEEN — AI Agent Development Guide

> This guide is written for AI coding agents who are new to the project. It is based on the actual files in the repository as of the last exploration. Read it alongside the repository layout, then make minimal, well-tested changes.

## Project Overview

MuslimEEN (Muslim Economic Empowerment Network) is an invitation-only professional networking platform for the Muslim community, with Shariah-compliant financial tools. The codebase is a TypeScript monorepo licensed under AGPL-3.0.

Core platform immutables (non-negotiable):

- No advertising or user data sales.
- No discrimination by sect or ethnicity.
- No interest-based finance (riba-free operations).
- No user fees; revenue is only from B2B institutional services directed to a Waqf surplus.
- Complete transparency in governance, finances, and code.

Production targets:

- Frontend: hosted on Vercel (`muslimeen.org` / `muslimeen-webapp.vercel.app`).
- Backend API: hosted on Render (`api.muslimeen.org` / `muslimeen-api.onrender.com`).
- Database: PostgreSQL 14+ (Neon/Render managed database).
- Cache: Redis 7 (Upstash/Render managed Redis), used mainly for rate limiting.

## Repository Layout

```text
muslimeen-webapp/
├── package.json                  # Root orchestration (npm run dev, test, lint, format)
├── docker-compose.yml            # Local postgres:14, redis:7, backend, frontend
├── vercel.json                   # Vercel build + CSP + rewrite /api/* to backend
├── render.yaml                   # Render web service + postgres + redis + env vars
├── .env.example                  # Root env template (frontend + E2E vars)
├── .prettierrc                   # Shared Prettier config
├── .gitignore                    # Centralized ignore for all subdirectories
├── frontend/                     # Next.js 14 + React 18 + TypeScript
├── backend/                      # Node.js + Express + TypeScript API
├── e2e/                          # Playwright end-to-end tests
├── scripts/                      # Deployment, monitoring, and validation scripts
└── docs/                         # Project guides (TESTING, COMMIT_CONVENTIONS, etc.)
```

### Key subdirectories

| Directory | What lives here |
|-----------|-----------------|
| `frontend/app` | Next.js App Router pages (route groups, dynamic routes, loading/not-found) |
| `frontend/components` | Reusable React components, layout, feedback, icons, SEO |
| `frontend/lib` | API client, auth context, hooks (`useApi`, `useForm`), analytics, performance, Sentry helpers |
| `frontend/styles` | Per-feature stylesheets (landing, dashboard, marketplace, etc.) |
| `backend/src` | Express server, modular domain routes, shared middleware, config |
| `backend/database/migrations` | SQL schema (`001_initial_schema.sql`) and migration runner (`migrate.js`) |
| `backend/scripts` | One-off scripts: `create-api-key.ts`, `migrate-users-to-clerk.ts`, `verify-cleanup.ts`, etc. |
| `backend/src/__tests__` | Active Jest suites: integration, security, attacks, chaos, contract, critical flows |
| `backend/tests` | Legacy unit/integration tests and migration parity tests (kept for reference) |
| `e2e/tests` | Playwright E2E specs |

## Technology Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Frontend | Next.js 14 (App Router), React 18, TypeScript 5.5 | Custom CSS in `frontend/app/globals.css` (~1,492 lines) |
| UI/Auth | `@clerk/nextjs` 6.12 | Clerk is the only supported authentication provider |
| Backend | Node.js 18+, Express 4, TypeScript 5.9 | `commonjs` target, compiled to `backend/dist/` |
| Auth backend | `@clerk/express`, `@clerk/backend` | Legacy JWT flow removed; Clerk JWT only |
| Database | PostgreSQL 14+ | Schema owned by `backend/database/migrations/001_initial_schema.sql` |
| Cache | Redis 7 (optional in dev) | `ioredis` + `redis` clients; used for rate limiting |
| Validation | Zod (`backend/src/config/env.ts`) and Joi (some route validation) | Prefer Zod for env, Joi for request schemas |
| Logging | Winston | Structured JSON logs; use `LOG_LEVEL` to control |
| Error tracking | Sentry Next.js / Sentry Node | Optional; configure `SENTRY_DSN` |
| E2E | Playwright 1.58 | Chromium, Firefox, Pixel 5, iPhone 12, Google Chrome (CI) |
| Tests | Jest 29 + ts-jest + supertest | Coverage thresholds: 70% branches/functions/lines/statements |
| Containerization | Docker + docker-compose | `Dockerfile.dev` / `render.Dockerfile` |
| CI/CD | GitHub Actions | `.github/workflows/ci-cd.yml`, `pr-check.yml`, `nightly.yml`, `deploy.yml` |

## Environment Configuration

Create environment files from the templates and **never commit real secrets**.

- Root: `cp .env.example .env.local` (frontend + E2E variables).
- Backend: `cp backend/.env.example backend/.env`.
  - `DATABASE_URL` is required; must be a `postgresql://` URL.
  - `CLERK_SECRET_KEY` and `CLERK_WEBHOOK_SECRET` are required.
  - `CLERK_PUBLISHABLE_KEY` is required for the frontend Clerk provider to initialize.
  - `INVITE_TOKEN_SECRET` must be ≥32 cryptographically random characters.
  - `INTERNAL_API_KEY` is optional; generate one via `npm run create:api-key` for service-to-service calls.
  - `SYSTEM_READ_ONLY=true` blocks all mutating HTTP methods (emergency safety switch).

Backend env vars are validated at runtime by `backend/src/config/env.ts` using Zod. If validation fails, the process exits with a clear error list.

## Development Workflow

### Install dependencies

The root `package.json` does **not** use npm workspaces; dependencies are installed independently in each folder:

```bash
cd backend && npm install
cd ../frontend && npm install
cd .. && npm install     # root dev deps (concurrently, playwright)
```

### Start locally

Option 1 — everything via Docker Compose:

```bash
docker-compose up --build
```

This brings up PostgreSQL on 5432, Redis on 6379, backend on 3001, and frontend on 8080.

Option 2 — manual, against your own PostgreSQL/Redis:

```bash
# Terminal 1
cd backend && npm run dev      # http://localhost:3001

# Terminal 2
cd frontend && npm run dev     # http://localhost:8080
```

You can also use `npm run dev:all` from the root to run both via `concurrently`.

### Database migrations

```bash
cd backend
npm run migrate                # runs database/migrations/migrate.js
```

The initial schema is in `backend/database/migrations/001_initial_schema.sql`. It creates tables for users, profiles, work history, education, invitations, connections, trust scores, verification witnesses, marketplace items, sadaqah campaigns, donations, waqf, qard hasan loans, notifications, messages, and refresh tokens.

## Build, Lint, and Format Commands

### Root-level shortcuts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Start frontend only |
| `npm run dev:backend` | Start backend only |
| `npm run dev:all` | Start both backend and frontend concurrently |
| `npm run build` | Build frontend for production |
| `npm run build:backend` | Build backend for production (`tsc` + `tsc-alias`) |
| `npm start` | Start frontend production server |
| `npm start:backend` | Start compiled backend server |
| `npm run test` | Run backend unit + integration tests |
| `npm run test:unit` | Run backend unit tests (`__tests__/unit` pattern) |
| `npm run test:integration` | Run backend integration tests serially |
| `npm run test:coverage` | Run tests with coverage |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run test:e2e:ui` | Run Playwright in interactive UI mode |
| `npm run test:e2e:debug` | Run Playwright in debug mode |
| `npm run lint` | Lint both frontend and backend |
| `npm run format` | Format both frontend and backend |

> Note: `npm run test:unit` targets `__tests__/unit`, but that directory does not currently exist. The actual unit tests live in `backend/tests/unit/` and are discovered by `npm test` (plain Jest) via `testMatch`. Use `cd backend && npx jest tests/unit` to run them directly.

### Backend-specific

```bash
cd backend
npm run dev                    # nodemon hot reload
npm run build                  # compile TypeScript + resolve path aliases
npm run type-check             # tsc --noEmit
npm run test                   # jest (all matching tests)
npm run test:unit              # jest --testPathPattern=__tests__/unit
npm run test:integration       # jest --testPathPattern=__tests__/integration --runInBand
npm run test:coverage          # jest --coverage
npm run lint                   # eslint src/
npm run lint:fix
npm run format                 # prettier --write .
npm run format:check           # prettier --check .
npm run migrate                # run SQL migrations
npm run create:api-key         # generate an internal API key
npm run ci                     # lint + type-check + test:unit + build
```

### Frontend-specific

```bash
cd frontend
npm run dev                    # next dev -p 8080
npm run build                  # next build
npm run start                  # next start -p 8080
npm run lint                   # next lint
npm run format                 # prettier --write .
npm run format:check           # prettier --check .
npm run seo:audit              # node scripts/seo-audit.js
npm run analyze                # bundle analyzer
```

## Backend Architecture

### Entry point and middleware stack

`backend/src/server.ts` bootstraps Express in this order:

1. Trust proxy configuration.
2. Sentry request handlers.
3. **Security middleware**: Helmet, CORS, cookie parser, CSRF token setter (setter only, not validator), JSON body parser, request ID, security audit, input sanitization, XSS protection, security headers, read-only mode guard.
4. **Logging**: request logger + performance monitor.
5. **Health routes**: mounted at `/` (`/health`, `/health/live`, `/health/ready`, `/health/startup`, `/metrics`).
6. **API routes**: `app.use('/api', router)` from `backend/src/modules/router.ts`.
7. **Error handling**: 404 handler, Sentry error handler, centralized error handler.

### Modular routing (`backend/src/modules/router.ts`)

Routes are grouped by domain module:

- `auth` — public auth endpoints, invitation validation, deprecated `/login` and `/register` returning 501.
- `users` — current user/profile operations.
- `connections` — connection requests and status updates.
- `invites` — invite creation and management.
- `verification` — trust verification flows.
- `marketplace` — marketplace listings by vertical (`earn`, `build`, `live`, `protect`).
- `islamic-finance` — zakat, sadaqah, qard hasan, waqf.
- `analytics` — event tracking and beta metrics.
- `feedback` — feedback submission.
- `internal` — service-to-service routes protected by `internalApiAuth`.

Public routes are mounted **before** the `unifiedAuthenticate` middleware. All routes below it require a valid Clerk session. Webhooks (`/api/webhooks/clerk`) are public and must receive the raw request body for signature verification.

### Domain module structure

Each module generally contains:

```text
src/modules/<domain>/
├── index.ts              # Public module exports
├── routes.ts             # Express route definitions
├── controllers/          # HTTP request handlers
├── services/             # Business logic
├── repositories/         # SQL queries via @database
└── middleware/           # Module-specific auth (e.g., iam/middleware/clerkAuth.ts)
```

Core domains:

- `iam` — Identity and access management (Clerk auth, webhooks, user repository, account lockout, password service, webhook retry service).
- `profile` — User profile CRUD.
- `trust` — Trust score and verification witnesses.
- `network` — Connections.
- `marketplace` — Marketplace listings.
- `islamic-finance` — Islamic finance tools.
- `invites` — Invitation-only onboarding system.
- `shared` — Cross-cutting concerns: database pool, logger, rate limiter, sanitization, CSRF utilities, idempotency, response helpers, validation, event bus, types.

### Path aliases (`backend/tsconfig.json`)

Use these aliases in backend code; tests mirror them in `jest.config.js`:

| Alias | Resolves to |
|-------|-------------|
| `@shared/*` | `src/modules/shared/*` |
| `@iam/*` | `src/modules/iam/*` |
| `@profile/*` | `src/modules/profile/*` |
| `@trust/*` | `src/modules/trust/*` |
| `@network/*` | `src/modules/network/*` |
| `@marketplace/*` | `src/modules/marketplace/*` |
| `@islamic-finance/*` | `src/modules/islamic-finance/*` |
| `@invites/*` | `src/modules/invites/*` |
| `@database` | `src/modules/database/pool` |
| `@types` | `src/modules/shared/types` |
| `@config/*` | `src/config/*` |
| `@root-types` | `src/types` |

## Frontend Architecture

### Next.js App Router

`frontend/app/` uses the App Router with route groups and dynamic routes:

- `(marketing)/` — landing pages (`about`, home).
- `dashboard/` — authenticated dashboard.
- `profile/`, `people/[slug]/`, `connections/`, `messages/` — user-facing pages.
- `marketplace/[vertical]/` — marketplace verticals (`earn`, `build`, `live`, `protect`).
- `islamic-finance/` — finance tools.
- `verification/`, `verification/business/`, `verification/institutional/`, `trust-score/` — trust/verification flows.
- `settings/` — account settings sub-pages (`account`, `security`, `privacy`, `notifications`, `visibility`).
- `blog/`, `blog/[slug]/` — content pages.
- `login/`, `signup/`, `invite/`, `waitlist/` — auth and onboarding.

`frontend/app/layout.tsx` is the root layout. It wraps children in:

```text
ErrorBoundary > ClerkProvider > AnalyticsProvider > {children} + ToastContainer
```

It also sets global fonts (`Inter` + `Noto Naskh Arabic`), SEO metadata, favicons, and loads optional analytics (GA, GTM, Clarity) only when their env vars are present.

### Key frontend libraries

- `frontend/lib/api.ts` — API client with retry, offline detection, circuit breaker, and timeout handling. Relies on Clerk to inject the JWT `Authorization` header; manual CSRF handling was removed.
- `frontend/lib/useApi.ts` — Hook for async API calls with loading, error, and retry UI states.
- `frontend/lib/auth-context.tsx` — Clerk compatibility wrapper re-exporting a legacy `useAuth` API.
- `frontend/lib/useForm.ts` — Form hook with validation, loading state, and toast feedback.
- `frontend/components/ProtectedRoute.tsx` — Prevents flashes of protected content while Clerk initializes; also exports `PublicOnlyRoute` and `useAuthGuard`.
- `frontend/components/NetworkStatus.tsx` — Displays loading, error, retry, and offline states.
- `frontend/components/Toast.tsx` — Toast notifications (mounted globally in layout).
- `frontend/components/LoadingButton.tsx` — Button with loading states to prevent double submission; also exports `LoadingSpinner`, `Skeleton`, `ContentLoader`.
- `frontend/components/layout/AppLayout.tsx` — Main app shell: header, sidebar, navigation.

### Frontend path aliases (`frontend/tsconfig.json`)

`@/*` maps to `./*` (the `frontend` directory). Use `@/components/...` and `@/lib/...` consistently.

## Testing Strategy

The project uses three test tiers:

### 1. Backend unit tests (`backend/tests/unit/`)

Run with Jest. Test individual services in isolation using mocks.

```bash
cd backend
npx jest tests/unit --verbose
```

### 2. Backend integration and specialized tests (`backend/src/__tests__/`, `backend/tests/integration/`)

Hit real Express endpoints with a real PostgreSQL database. They must run serially (`--runInBand`) because they share a database.

Active suites under `backend/src/__tests__/`:
- `integration/` — API integration tests
- `security/` — security tests
- `attacks/` — attack/bypass tests
- `chaos/` — failure-mode and concurrency tests
- `contract/` — API contract tests
- `critical/` — critical flow tests (auth, invite races)

Legacy suites under `backend/tests/`:
- `unit/` — legacy unit tests for services
- `integration/` — legacy integration tests
- `modules/` — migration parity tests

```bash
cd backend
npm run test:integration       # runs src/__tests__/integration serially
npm run test                   # runs all matching Jest tests
```

The setup file (`backend/src/__tests__/setup.ts`) verifies the database connection before all tests and closes the pool after. The integration suite expects `DATABASE_URL` or the split `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` variables to point to a migrated test database.

### 3. E2E tests (`e2e/`)

Playwright tests run against the full stack. The config is in `e2e/playwright.config.ts`.

```bash
npm run test:e2e       # headless
npm run test:e2e:ui    # interactive UI mode
npm run test:e2e:debug # debug mode
```

Playwright starts `npm run dev:all` automatically when needed. It tests Chromium, Firefox, Pixel 5, iPhone 12, and Google Chrome in CI.

### Coverage

`backend/jest.config.js` enforces 70% minimum coverage for branches, functions, lines, and statements. Coverage is excluded from `index.ts`, `types.ts`, `routes.ts`, `server.ts`, tests, and mocks.

### Test databases

- `muslimeen` — development database.
- `muslimeen_test` — integration/E2E test database (create manually with `psql -U postgres -c "CREATE DATABASE muslimeen_test;"`).
- `muslimeen_test_modular` — referenced by legacy migration parity tests.

## Code Style and Conventions

### Prettier

`.prettierrc` at the repo root:

- `semi: true`
- `singleQuote: true`
- `trailingComma: es5`
- `printWidth: 100`
- `tabWidth: 2`
- `useTabs: false`
- `endOfLine: lf`

Run `npm run format` from root to format both workspaces.

### ESLint

Backend: `backend/.eslintrc.json` extends `eslint:recommended` and `@typescript-eslint/recommended`.
- `no-console: warn`
- `no-unused-vars` error, but `_` prefix is ignored.
- `prefer-const: error`.
- `@typescript-eslint/no-explicit-any: warn`.

Frontend: uses `next lint` (Next.js default ESLint config). ESLint errors are ignored during development builds because of `eslint.ignoreDuringBuilds: true` in `next.config.js`; TypeScript errors are also ignored in development (`typescript.ignoreBuildErrors: true`). Production builds should be clean.

### Commits

The project uses Conventional Commits enforced by `backend/.commitlintrc.json`:

```text
type(scope): subject

[body]

[footer]
```

Allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`, `build`, `revert`.
Allowed scopes: `auth`, `user`, `profile`, `connection`, `marketplace`, `finance`, `trust`, `notification`, `api`, `db`, `deps`, `config`.
Subject max length: 72 chars, no trailing period.

Husky hooks are installed in `backend/.husky` and `frontend/.husky`:
- `pre-commit` runs `npx lint-staged`.
- `commit-msg` runs `commitlint` from the `backend` directory.

Lint-staged in both workspaces formats and lints `*.{ts,tsx,js,jsx}` and `*.json`.

## Deployment and CI/CD

### GitHub Actions

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci-cd.yml` | push/PR to `main` or `staging`, plus manual dispatch | Lint, type-check, test, build, security scan, CodeQL, deploy backend to Render and frontend to Vercel on `main` push |
| `pr-check.yml` | PRs to `main`/`staging` | Backend and frontend lint + build, bundle size check, PR comment |
| `nightly.yml` | 02:00 UTC daily | Full backend test suite, dependency audit, migration dry-run, performance benchmark |
| `deploy.yml` | push/PR to `main` | Runs test and build jobs; the deploy job is currently commented out |

### Render (backend)

`render.yaml` declares:

- Web service `muslimeen-api` running Node.
- PostgreSQL database `muslimeen-db`.
- Redis `muslimeen-redis`.
- Environment variables for Clerk, database, CORS, Sentry, Redis, internal API, and feature flags.
- `autoDeploy: false` — manual deploys for safety.
- Health check path: `/api/health`.

### Vercel (frontend)

`vercel.json` declares:

- Build command: `cd frontend && npm install && npm run build`.
- Output directory: `frontend/.next`.
- Region: `iad1`.
- CSP headers at the edge (Clerk, Google Fonts, self origins allowed).
- Rewrite `/api/(.*)` to `${NEXT_PUBLIC_API_URL}/$1`.

### Deployment scripts

The `scripts/` directory contains operational scripts:

- `deploy.sh`, `deploy-backend.ts`, `deploy-frontend.sh` — production deployment helpers.
- `health-check.sh`, `verify-deployment.sh`, `verify-frontend.sh` — post-deploy checks.
- `production-validation.ts`, `pre-deployment-check.ts`, `system-validation.ts` — pre-flight validation.
- `long-term-monitor.ts`, `monitor-deployment.ts`, `monitor-dashboard.ts` — runtime monitoring.
- `cleanup-legacy-auth.sh`, `production-cleanup.sh` — legacy cleanup.
- `generate-stability-report.ts` — stability reporting.

## Security Considerations

- **No legacy auth**: JWT-based authentication was removed. Clerk is the only supported auth provider. `backend/src/modules/iam/middleware/unifiedAuth.ts` is the primary auth guard.
- **CSRF transition**: The frontend API client (`frontend/lib/api.ts`) no longer sends CSRF tokens; it relies on Clerk's JWT for authentication. The backend still mounts `csrfTokenSetter` (`backend/src/modules/shared/middleware/csrf.ts`) but does **not** mount the `csrfValidator`, so CSRF enforcement is currently inactive.
- **Secrets**: All secrets live in `.env` files or the platform secret manager. Never commit `.env`, `.env.local`, or `*.pem` files.
- **CORS**: Strictly configured in `backend/src/config/cors.ts`. Allowed production origins are hard-coded; development allows only specific localhost origins.
- **Helmet**: Security headers are set via `backend/src/config/security.ts`. CSP is duplicated at the Vercel edge in `vercel.json`.
- **Input sanitization**: `sanitizeInput` and `xssProtection` middleware run on all requests.
- **Rate limiting**: `apiLimiter` in `backend/src/modules/shared/middleware/rateLimiter.ts`.
- **Read-only mode**: `SYSTEM_READ_ONLY=true` blocks `POST`, `PUT`, `DELETE`, and `PATCH` globally.
- **Internal API**: `INTERNAL_API_KEY` protects service-to-service routes. Generate keys with `npm run create:api-key`.
- **Webhook verification**: Clerk webhooks (`/api/webhooks/clerk`) verify the `svix` signature using the raw request body.
- **Database queries**: Repository layer uses parameterized queries (`pg`) to prevent SQL injection.
- **Sentry**: Configured to filter cookies, authorization headers, and passwords.

## Observability

- **Structured logs**: Winston JSON logs with correlation IDs, method, path, status code, duration, and user ID. `backend/logs/combined.log` and `backend/logs/error.log`.
- **Health endpoints**: `/health`, `/health/live`, `/health/ready`, `/health/startup`, `/metrics`.
- **Performance**: Slow requests (>500ms warning, >1000ms slow, >5000ms critical) are logged. `X-Response-Time` header is added in non-production.
- **Sentry**: Optional; set `SENTRY_DSN` in both backend and frontend env.
- **Alerts**: Configurable thresholds for error rate, response time, memory, disk, CPU (see `docs/OBSERVABILITY.md`).

## Common Conventions and Gotchas

1. **Always import the validated `env` object** instead of reading `process.env` directly in backend code: `import { env } from '@config/env';`.
2. **Backend middleware order matters**. `cookie-parser` must run before the CSRF setter; body parsers must run before route handlers; `readOnlyMode` must run after body parsing but before routes.
3. **Clerk webhook routes must stay public** and receive the raw body. Do not mount the unified auth middleware before them.
4. **Frontend API calls should go through `useApi` or `lib/api.ts`** to get automatic retry, offline handling, and user-friendly error messages. Clerk injects the JWT automatically.
5. **Use `LoadingButton` and `useForm`** for all user actions to prevent double submissions and provide feedback.
6. **Mount `ToastContainer` once** in `app/layout.tsx` only. Do not add a second container per page.
7. **Keep migrations additive** when possible; the nightly CI runs a migration dry-run against an empty test database.
8. **Feature flags exist but default to `false`**. The backend has `USE_MODULAR_*` flags; however the active code already uses the modular router by default. Changing feature flags can re-enable legacy paths. Do not flip them unless you understand the migration parity tests.
9. **Tests share a real database**. Integration tests must be run serially (`--runInBand`). Use unique identifiers per test to avoid collisions.
10. **E2E tests expect the full stack** on `http://localhost:8080`. Playwright can start it for you; otherwise set `PLAYWRIGHT_BASE_URL`.
11. **`npm run test:unit` is currently a partial no-op** because `backend/src/__tests__/unit` does not exist. Run `cd backend && npx jest tests/unit` for the actual unit suite, or use `npm test` to run Jest's full `testMatch` discovery.
12. **`npm run setup:test-db` references a non-existent `npm run seed` script**. Use `cd backend && npm run migrate` directly after creating the test database.

## Useful Documentation

| Document | What it covers |
|----------|----------------|
| `README.md` | Project overview, quick start, mission, features, stack |
| `docs/TESTING.md` | Jest, Playwright, test DB setup, troubleshooting |
| `docs/COMMIT_CONVENTIONS.md` | Conventional Commits types and scopes |
| `docs/LOCALHOST_SETUP.md` | Local dev setup, ports, smoke tests |
| `docs/AUTH_SYSTEM_GUIDE.md` | Auth architecture, `useAuth`, `useApi`, ProtectedRoute, multi-tab logout |
| `docs/OBSERVABILITY.md` | Logging, health checks, Sentry, performance, alerting |
| `docs/BETA_GUIDE.md` | Beta metrics, analytics events, feedback collection, monitoring checklist |
| `docs/QA_FIXES_SUMMARY.md` | Recent QA fixes (toast, error boundary, E2E) |
| `docs/UX_IMPROVEMENTS.md` | Loading buttons, skeletons, form hooks, error messages |
| `backend/docs/READ_ONLY_MODE.md` | Read-only mode behavior and ops |
| `backend/docs/IDEMPOTENT_CLEANUP_SCRIPTS.md` | Safe cleanup scripts |
| `backend/src/openapi.yaml` | OpenAPI contract for the backend API |

## Quick Reference for Agents

```bash
# Full local stack
docker-compose up --build

# Or manual
cd backend && npm run dev
cd frontend && npm run dev

# Lint/format everything
npm run lint
npm run format

# Backend checks
cd backend
npm run type-check
npm run test
npm run build

# Frontend checks
cd frontend
npm run lint
npm run build

# E2E
npm run test:e2e

# Migrations
cd backend && npm run migrate

# Create internal API key
cd backend && npm run create:api-key -- --name="MyService" --scope=admin
```