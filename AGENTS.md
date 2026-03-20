# MuslimEEN - AI Agent Development Guide

> **LinkedIn for the Muslim Community**  
> An invitation-only professional networking platform with Shariah-compliant financial tools.

This document provides essential information for AI coding agents working on the MuslimEEN project. It covers architecture, development workflows, testing strategies, and project-specific conventions.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Development Environment Setup](#development-environment-setup)
- [Build and Test Commands](#build-and-test-commands)
- [Code Style Guidelines](#code-style-guidelines)
- [Testing Instructions](#testing-instructions)
- [Security Considerations](#security-considerations)
- [Deployment Process](#deployment-process)
- [Module Architecture](#module-architecture)

---

## Project Overview

MuslimEEN (Muslim Economic Empowerment Network) is a full-stack professional networking platform built specifically for the Muslim community. It features:

- **Professional Networking**: Trust-based profiles with 0-1000 trust score system
- **Marketplace**: Four verticals (EARN, BUILD, LIVE, PROTECT) for economic activities
- **Islamic Finance Tools**: Zakat calculator, Qard Hasan (interest-free loans), Sadaqah campaigns, Waqf management
- **Verification System**: Biometric, two-witness, and business verification
- **Invitation-Only Access**: Maintains community quality through referrals

### Core Platform Immutables

These principles are non-negotiable:

- ✅ No advertising or user data sales
- ✅ Open source forever (AGPL-3.0) with data portability
- ✅ Non-discrimination by sect or ethnicity
- ✅ No interest-based finance (riba-free operations)
- ✅ Complete transparency in governance, finances, and code
- ✅ No user fees; revenue only from B2B institutional services

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14 + TypeScript + React |
| **Backend** | Node.js + Express + TypeScript |
| **Database** | PostgreSQL 14+ |
| **Cache** | Redis |
| **Testing** | Jest (backend) + Playwright (e2e) |
| **CI/CD** | GitHub Actions |
| **Hosting** | Render (backend), Vercel (frontend) |

### Key Dependencies

**Backend:**
- `express` - Web framework
- `pg` - PostgreSQL client
- `redis` - Redis client
- `jsonwebtoken` - JWT authentication
- `bcrypt` - Password hashing (12 rounds)
- `helmet` - Security headers
- `express-rate-limit` - Rate limiting
- `joi` / `zod` - Schema validation
- `winston` - Logging
- `@sentry/node` - Error tracking

**Frontend:**
- `next` - React framework (App Router)
- `@sentry/nextjs` - Error tracking
- `react` / `react-dom` - UI library

---

## Project Structure

```
muslimeen/
├── frontend/                 # Next.js 14 application
│   ├── app/                 # App Router pages
│   │   ├── (marketing)/     # Landing pages (unauthenticated)
│   │   ├── (dashboard)/     # Dashboard routes
│   │   ├── dashboard/       # User dashboard
│   │   ├── profile/         # User profiles
│   │   ├── marketplace/     # Marketplace [vertical] routes
│   │   ├── islamic-finance/ # Zakat, Qard Hasan, Sadaqah, Waqf
│   │   ├── verification/    # Trust verification flows
│   │   ├── settings/        # User settings
│   │   └── connections/     # Network connections
│   ├── components/          # React components
│   ├── lib/                 # Utilities & API client
│   ├── styles/              # Additional styles
│   └── public/              # Static assets
│
├── backend/                  # Node.js/Express API
│   ├── src/
│   │   ├── server.ts        # Entry point
│   │   ├── routes/          # Legacy API routes
│   │   ├── modules/         # Modular architecture (8 domains)
│   │   │   ├── iam/         # Identity & Access Management
│   │   │   ├── profile/     # User profiles
│   │   │   ├── trust/       # Trust scores & verification
│   │   │   ├── network/     # Connections
│   │   │   ├── marketplace/ # Marketplace
│   │   │   ├── islamic-finance/ # Islamic finance tools
│   │   │   ├── invites/     # Invitation system
│   │   │   └── shared/      # Shared utilities
│   │   ├── config/          # Configuration (env, CORS, security)
│   │   ├── __tests__/       # Test suites
│   │   │   ├── unit/        # Unit tests
│   │   │   ├── integration/ # Integration tests
│   │   │   ├── security/    # Security tests
│   │   │   └── critical/    # Critical flow tests
│   │   └── types/           # TypeScript type definitions
│   ├── database/
│   │   ├── migrations/      # SQL migration files
│   │   └── seeds/           # Seed data
│   └── scripts/             # Utility scripts
│
├── e2e/                     # Playwright end-to-end tests
│   ├── tests/               # E2E test files
│   └── playwright.config.ts # Playwright configuration
│
├── scripts/                 # Deployment & utility scripts
├── .github/workflows/       # GitHub Actions CI/CD
└── docs/                    # Documentation
```

---

## Development Environment Setup

### Prerequisites

- **Node.js** >= 18.0.0
- **PostgreSQL** 14+
- **Redis** (optional for local dev, required for full features)
- **Git**

### Quick Setup

```bash
# Clone repository
git clone https://github.com/mdfaizanashrafi/muslimEEN-webapp.git
cd muslimEEN-webapp

# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Database setup
cd ../backend
psql -U postgres -c "CREATE DATABASE muslimeen;"
npm run migrate

# Environment setup
cp .env.example .env
# Edit .env with your database credentials
```

### Docker Compose Setup (Recommended)

```bash
# Start all services (PostgreSQL, Redis, Backend, Frontend)
docker-compose up -d

# Services will be available at:
# - Frontend: http://localhost:8080
# - Backend: http://localhost:3001
# - PostgreSQL: localhost:5432
# - Redis: localhost:6379
```

### Environment Variables

**Backend (`backend/.env`):**
```env
NODE_ENV=development
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=muslimeen
DB_USER=muslimeen
DB_PASSWORD=your_secure_password
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=24h
BCRYPT_ROUNDS=12
CSRF_SECRET=your-csrf-secret
COOKIE_SECRET=your-cookie-secret
FRONTEND_URL=http://localhost:8080
REDIS_URL=redis://localhost:6379
SENTRY_DSN=your-sentry-dsn
```

**Frontend (`frontend/.env.local`):**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_BASE_URL=http://localhost:8080
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
```

---

## Build and Test Commands

### Root Level Commands

```bash
# Development (run both frontend and backend)
npm run dev:all

# Individual development
npm run dev          # Frontend only (port 8080)
npm run dev:backend  # Backend only (port 3001)

# Testing
npm test             # Run all tests (unit + integration)
npm run test:unit    # Unit tests only
npm run test:integration  # Integration tests only
npm run test:e2e     # Playwright E2E tests
npm run test:e2e:ui  # Playwright with UI
npm run test:all     # All tests including E2E

# Code quality
npm run lint         # ESLint check
npm run format       # Prettier format
```

### Backend Commands

```bash
cd backend

# Development
npm run dev          # Start with hot reload (nodemon)

# Building
npm run build        # Compile TypeScript
npm run build:watch  # Watch mode compilation
npm run type-check   # TypeScript check without emit

# Testing
npm test             # Run all tests
npm run test:unit    # Unit tests only
npm run test:integration  # Integration tests only
npm run test:coverage     # With coverage report

# Database
npm run migrate      # Run migrations
npm run seed         # Seed database
npm run create-admin # Create admin user

# Code quality
npm run lint         # ESLint
npm run lint:fix     # ESLint with fixes
npm run format       # Prettier format
npm run ci           # Full CI check (lint + type-check + test + build)
```

### Frontend Commands

```bash
cd frontend

# Development
npm run dev          # Start dev server (port 8080)

# Building
npm run build        # Production build
npm run analyze      # Bundle analysis

# Code quality
npm run lint         # ESLint
npm run format       # Prettier format
npm run format:check # Check formatting

# SEO
npm run seo:audit    # Run SEO audit
```

---

## Code Style Guidelines

### TypeScript Strict Mode

The project uses **strict TypeScript** configuration. Key rules:

- Explicit return types on exported functions
- No implicit `any` — always define types
- Use interfaces over type aliases for objects
- Enable strict mode in `tsconfig.json`

```typescript
// ✅ Good
interface User {
  id: string;
  email: string;
  trustScore: number;
}

function getUserById(id: string): Promise<User | null> {
  // Implementation
}

// ❌ Bad
function getUserById(id: any): any {
  // Implementation
}
```

### JSDoc Documentation

All exported functions, classes, and interfaces must have JSDoc comments:

```typescript
/**
 * Calculates Zakat obligation based on user's assets
 * 
 * @param assets - Array of asset values in USD
 * @param goldPrice - Current gold price per gram
 * @param nisabDays - Days held above nisab threshold
 * @returns Calculated Zakat amount or null if below nisab
 * @throws {ValidationError} If assets array is empty
 */
export function calculateZakat(
  assets: number[],
  goldPrice: number,
  nisabDays: number = 354
): number | null {
  // Implementation
}
```

### Prettier Configuration

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

### ESLint Key Rules

- `@typescript-eslint/no-explicit-any`: warn
- `@typescript-eslint/no-unused-vars`: error (except `_` prefix)
- `no-console`: warn (use logger instead)
- `prefer-const`: error

### Commit Message Format

We follow **Conventional Commits** enforced by commitlint:

```
<type>(<scope>): <subject>

<body> (optional)

<footer> (optional)
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`, `build`, `revert`

**Scopes:** `auth`, `user`, `profile`, `connection`, `marketplace`, `finance`, `trust`, `notification`, `api`, `db`, `deps`, `config`

**Examples:**
```bash
feat(marketplace): add filtering by vertical type
fix(auth): resolve JWT expiration issue
docs(api): update authentication docs
```

---

## Testing Instructions

### Test Structure

```
backend/src/__tests__/
├── unit/                  # Unit tests (isolated functions)
│   └── services/
├── integration/           # API endpoint tests
├── security/              # Security tests
├── critical/              # Critical flow tests
├── contract/              # API contract tests
├── chaos/                 # Chaos/failure mode tests
├── attacks/               # Attack simulation tests
└── setup.ts               # Jest setup file
```

### Running Tests

```bash
# All tests
cd backend && npm test

# Specific test types
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests only
npm run test:coverage    # With coverage report

# Specific files
npm test -- TrustScoreService.test.ts

# Watch mode
npm test -- --watch

# E2E tests
cd ../e2e
npx playwright test      # Run all E2E tests
npx playwright test --ui # With UI
```

### Test Coverage Requirements

| Metric | Minimum | Target |
|--------|---------|--------|
| Statements | 70% | 90% |
| Branches | 70% | 85% |
| Functions | 70% | 90% |
| Lines | 70% | 90% |

### Test Naming Conventions

```typescript
// ✅ Good - descriptive and specific
describe('TrustScoreService', () => {
  describe('calculateScore', () => {
    it('should return 500 for user with biometric verification', async () => {
      // test
    });

    it('should throw ValidationError when userId is empty', async () => {
      // test
    });
  });
});
```

---

## Security Considerations

### Security Stack

- **Helmet.js** - Security headers (CSP, HSTS, etc.)
- **CORS** - Cross-origin protection
- **Rate Limiting** - Request throttling (100 req/15min default)
- **JWT** - Stateless authentication with refresh tokens
- **bcrypt** - Password hashing (12 rounds)
- **Input Validation** - Joi/Zod schema validation
- **XSS Protection** - Escaped HTML, CSP headers
- **SQL Injection Prevention** - Parameterized queries via pg
- **CSRF Protection** - Double-submit cookie pattern

### Security Headers (Frontend)

The Next.js config includes production-grade CSP:
- `Strict-Transport-Security`: max-age=63072000
- `X-Frame-Options`: SAMEORIGIN
- `X-Content-Type-Options`: nosniff
- `Content-Security-Policy`: Strict policy with API host whitelisting

### Environment Security

**CRITICAL:** Never commit `.env` files with real secrets!

Secret generation commands:
```bash
# JWT_SECRET (min 32 chars)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# CSRF_SECRET / COOKIE_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Required Secrets in Production

- `JWT_SECRET` - Minimum 32 characters, cryptographically random
- `DB_PASSWORD` - Strong password (16+ chars)
- `CSRF_SECRET` - Minimum 32 characters
- `COOKIE_SECRET` - Minimum 32 characters

---

## Deployment Process

### Architecture

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Vercel    │──────▶   Render    │──────▶    Neon     │
│  (Frontend) │      │  (Backend)  │      │ (Database)  │
└─────────────┘      └──────┬──────┘      └─────────────┘
                            │
                            ▼
                     ┌─────────────┐
                     │   Upstash   │
                     │   (Redis)   │
                     └─────────────┘
```

### CI/CD Pipeline

**GitHub Actions workflows:**

1. **PR Validation** (`.github/workflows/pr-check.yml`)
   - Lint and type checking
   - Build verification
   - Bundle size check

2. **CI/CD Pipeline** (`.github/workflows/ci-cd.yml`)
   - Backend CI (lint, test, build)
   - Frontend CI (lint, build)
   - Security scanning (npm audit, CodeQL)
   - Deploy to Render (backend)
   - Deploy to Vercel (frontend)
   - Post-deployment health checks

### Deployment Commands

```bash
# Deploy to production
./scripts/deploy.sh production

# Health check
./scripts/health-check.sh production
```

### Required GitHub Secrets

- `RENDER_DEPLOY_HOOK` - Render deployment hook URL
- `VERCEL_TOKEN` - Vercel authentication token
- `VERCEL_ORG_ID` - Vercel organization ID
- `VERCEL_PROJECT_ID` - Vercel project ID
- `CODECOV_TOKEN` - Codecov upload token
- `PROD_API_URL` / `STAGING_API_URL` - API URLs

---

## Module Architecture

The backend uses a **hybrid architecture** supporting both legacy and modular implementations:

### Legacy Architecture
- Monolithic controllers in `src/controllers/`
- Original route handlers

### Modular Architecture (Domain-Driven)
Located in `src/modules/`:

| Module | Domain | Feature Flag |
|--------|--------|--------------|
| `iam/` | Identity & Access Management | `USE_MODULAR_IAM` |
| `profile/` | User profiles | `USE_MODULAR_PROFILE` |
| `trust/` | Trust scores & verification | `USE_MODULAR_TRUST` |
| `network/` | Connections | `USE_MODULAR_NETWORK` |
| `marketplace/` | Marketplace | `USE_MODULAR_MARKETPLACE` |
| `islamic-finance/` | Islamic finance tools | `USE_MODULAR_ISLAMIC_FINANCE` |
| `invites/` | Invitation system | `USE_MODULAR_INVITATIONS` |
| `shared/` | Common utilities | N/A |

### Module Structure

Each module follows this structure:
```
modules/[module-name]/
├── controllers/      # Request handlers
├── services/         # Business logic
├── repositories/     # Data access layer
├── middleware/       # Module-specific middleware
├── types.ts          # Module types
└── index.ts          # Module exports
```

### Feature Flags

Toggle modules in `backend/.env`:
```env
USE_MODULAR_IAM=true
USE_MODULAR_PROFILE=true
USE_MODULAR_TRUST=false
USE_MODULAR_NETWORK=false
USE_MODULAR_MARKETPLACE=false
USE_MODULAR_ISLAMIC_FINANCE=false
USE_MODULAR_INVITATIONS=true
USE_MODULAR_NOTIFICATIONS=false
```

### Path Aliases

Module path aliases in `tsconfig.json`:
```typescript
import { UserRepository } from '@iam/repositories/UserRepository';
import { TrustScoreService } from '@trust/services/TrustScoreService';
import { featureFlags } from '@shared/config/featureFlags';
```

---

## API Development Guidelines

### Response Format

Standard API response structure:
```typescript
// Success
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}

// Error
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

### Route Registration

Routes are registered in `src/modules/router.ts` with feature flag checks:
```typescript
import { featureFlags } from './shared/config/featureFlags';

// Modular route (conditional)
if (featureFlags.useModularIAM) {
  router.use('/auth', iamRoutes);
}

// Legacy route (fallback)
router.use('/auth', legacyAuthRoutes);
```

---

## Database Migrations

Migration files are in `backend/database/migrations/`:

```bash
# Run migrations
cd backend && npm run migrate

# Create new migration
# Add SQL file with next sequence number: XXX_description.sql
```

Migration naming convention:
- `001_initial_schema.sql`
- `002_invite_system_refactor.sql`
- `003_fix_schema_issues.sql`

---

## Useful Resources

- [API_CONTRACT.md](API_CONTRACT.md) - API specification
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guidelines
- [DEVOPS_ARCHITECTURE.md](DEVOPS_ARCHITECTURE.md) - Complete DevOps docs
- [CI_CD_README.md](CI_CD_README.md) - CI/CD documentation
- [DEPLOY-STEP-BY-STEP.md](DEPLOY-STEP-BY-STEP.md) - Deployment guide

---

## Contact & Support

- **Website**: https://muslimeen.space
- **Email**: contact@muslimeen.space
- **GitHub Issues**: For bug reports and feature requests

---

<p align="center">
  <strong>Made with ❤️ for the Muslim Ummah</strong><br>
  <em>"The believers are but a single brotherhood" — Quran 49:10</em>
</p>
