# MuslimEEN CI/CD Pipeline Documentation

> **Production-Grade GitHub Actions CI/CD Implementation**  
> **Version**: 1.0.0 | **Date**: March 2026

---

## Quick Start

```bash
# Deploy to staging
./scripts/deploy.sh staging

# Deploy to production
./scripts/deploy.sh production

# Check health
./scripts/health-check.sh production
```

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Workflows](#workflows)
3. [Required Secrets](#required-secrets)
4. [Environment Setup](#environment-setup)
5. [Deployment Process](#deployment-process)
6. [Monitoring & Alerts](#monitoring--alerts)
7. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MUSLIMEEN CI/CD ARCHITECTURE                        │
└─────────────────────────────────────────────────────────────────────────────┘

GitHub Repository
       │
       ▼
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   CI PIPELINE    │────▶│  SECURITY SCAN   │────▶│   CD PIPELINE    │
│  (Build & Test)  │     │ (CodeQL + Deps)  │     │  (Deploy)        │
└──────────────────┘     └──────────────────┘     └──────────────────┘
       │                       │                        │
       ▼                       ▼                        ▼
  ┌─────────┐           ┌────────────┐           ┌────────────┐
  │ Backend │           │ CodeQL     │           │  Backend   │
  │ Build   │           │ Analysis   │           │  Render    │
  └─────────┘           └────────────┘           └────────────┘
       │                       │                        │
  ┌─────────┐           ┌────────────┐           ┌────────────┐
  │ Frontend│           │ NPM Audit  │           │  Frontend  │
  │ Build   │           │ (critical) │           │  Vercel    │
  └─────────┘           └────────────┘           └────────────┘
```

### Infrastructure Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| CI/CD | GitHub Actions | Build, test, deploy |
| Backend Hosting | Render | Node.js/Express API |
| Frontend Hosting | Vercel | Next.js application |
| Database | Neon | PostgreSQL |
| Cache | Upstash | Redis |
| Monitoring | Sentry | Error tracking |

---

## Workflows

### 1. Main CI/CD Pipeline (`ci-cd.yml`)

**Triggers**:
- Push to `main` or `staging`
- Pull request to `main` or `staging`
- Manual dispatch

**Jobs**:

| Job | Purpose | Duration |
|-----|---------|----------|
| `backend-ci` | Lint, type-check, test, build | ~2 min |
| `frontend-ci` | Lint, build | ~2 min |
| `security-scan` | npm audit | ~30s |
| `codeql` | Security analysis | ~5 min |
| `deploy-backend` | Deploy to Render | ~2 min |
| `deploy-frontend` | Deploy to Vercel | ~1 min |

### 2. PR Validation (`pr-check.yml`)

**Triggers**: Pull requests

**Jobs**:
- Backend PR check (lint, type-check, build)
- Frontend PR check (lint, build)
- Bundle size check
- PR comment with results

### 3. Nightly Tests (`nightly.yml`)

**Schedule**: Daily at 2:00 AM UTC

**Jobs**:
- Full test suite (unit + integration)
- Dependency vulnerability scan
- Database migration dry-run
- Performance benchmarks

---

## Required Secrets

### Repository Secrets (GitHub)

Configure these in: **Settings > Secrets and variables > Actions**

| Secret | Required By | How to Obtain |
|--------|-------------|---------------|
| `RENDER_DEPLOY_HOOK` | Backend CD | Render Dashboard > Settings > Deploy Hook |
| `VERCEL_TOKEN` | Frontend CD | Vercel > Settings > Tokens |
| `VERCEL_ORG_ID` | Frontend CD | Vercel CLI: `vercel teams ls` |
| `VERCEL_PROJECT_ID` | Frontend CD | Vercel project settings |
| `CODECOV_TOKEN` | Coverage | Codecov.io dashboard |

### Application Environment Variables

These are configured in the respective platforms (Render, Vercel).

**Render (Backend)**:
```
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://...
REDIS_URL=rediss://...
JWT_SECRET=...
CORS_ORIGIN=https://muslimeen.org
SENTRY_DSN=...
```

**Vercel (Frontend)**:
```
NEXT_PUBLIC_API_URL=https://api.muslimeen.org
NEXT_PUBLIC_APP_NAME=MuslimEEN
NEXT_PUBLIC_SENTRY_DSN=...
```

---

## Environment Setup

### Step 1: Configure GitHub Repository

1. Go to **Settings > Secrets and variables > Actions**
2. Add all required secrets listed above
3. Enable **Settings > Actions > General > Allow all actions**

### Step 2: Configure Render

1. Create a new Web Service
2. Connect your GitHub repository
3. Configure:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/api/health`
4. Disable auto-deploy (we use GitHub Actions)
5. Create a Deploy Hook and add to GitHub secrets

### Step 3: Configure Vercel

1. Import project from GitHub
2. Configure:
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
3. Disable auto-deploy
4. Add `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` to GitHub secrets

### Step 4: Configure Neon

1. Create a new project
2. Copy connection string to Render environment variables
3. Enable connection pooling for production

### Step 5: Configure Upstash

1. Create Redis database
2. Copy connection string (TLS required)
3. Add to Render environment variables

---

## Deployment Process

### Automatic Deployment

Deployments are automatic on push to `main`:

```
1. Developer pushes to main
2. GitHub Actions triggers CI/CD workflow
3. Build and tests run
4. Security scans execute
5. Backend deploys to Render
6. Frontend deploys to Vercel
7. Health checks verify deployment
8. Slack/email notification sent
```

### Manual Deployment

```bash
# Using the deployment script
./scripts/deploy.sh production

# Or trigger via GitHub UI
# Actions > CI/CD Pipeline > Run workflow
```

### Rollback

**Render**:
```bash
render rollback <service-id> --version <previous>
```

**Vercel**:
```bash
vercel rollback --yes
```

**Database**:
```bash
cd backend
npm run migrate:rollback
```

---

## Monitoring & Alerts

### Health Checks

The pipeline automatically runs health checks after deployment:

**Backend**:
```bash
curl https://api.muslimeen.org/api/health
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-03-07T02:00:00.000Z",
    "database": "connected",
    "redis": "connected"
  }
}
```

### Manual Health Check

```bash
# Check all services
./scripts/health-check.sh production

# Check specific environment
./scripts/health-check.sh staging
```

### Notifications

The pipeline sends notifications to:
- **GitHub**: PR comments with deployment status
- **Slack**: #deployments channel (configure webhook)
- **Email**: On-call engineer on failure

---

## Troubleshooting

### Build Failures

**TypeScript Errors**:
```bash
cd backend
npm run type-check
```

**Test Failures**:
```bash
cd backend
npm test
```

**Lint Errors**:
```bash
cd backend
npm run lint
```

### Deployment Failures

**Render Deploy Hook Not Working**:
- Verify `RENDER_DEPLOY_HOOK` secret is correct
- Check Render service logs

**Vercel Deployment Failed**:
- Verify `VERCEL_TOKEN` has correct permissions
- Check Vercel CLI version

**Health Check Failed**:
- Check application logs in Render/Vercel
- Verify environment variables are set
- Run `./scripts/health-check.sh` locally

### Common Issues

| Issue | Solution |
|-------|----------|
| Tests timeout | Increase `testTimeout` in jest.config.js |
| Build out of memory | Add `NODE_OPTIONS=--max-old-space-size=4096` |
| Cache issues | Clear GitHub Actions cache |
| Secret not found | Verify secret name matches exactly |

### Getting Help

1. Check workflow logs in GitHub Actions
2. Review application logs in Render/Vercel
3. Run tests locally to reproduce
4. Contact DevOps team: devops@muslimeen.org

---

## Security

### Security Measures

- ✅ CodeQL analysis on every push
- ✅ Dependency audit (fails on critical vulnerabilities)
- ✅ Secrets scanning
- ✅ OIDC authentication for cloud providers
- ✅ Commit SHA pinning for actions
- ✅ Minimal workflow permissions

### Security Reporting

Report security issues to: security@muslimeen.org

---

## Contributing

### Adding New Workflows

1. Create workflow file in `.github/workflows/`
2. Use pinned action versions (commit SHA)
3. Add to this documentation
4. Test on feature branch

### Modifying Existing Workflows

1. Create a PR with changes
2. Verify PR validation passes
3. Get review from DevOps team
4. Merge to main

---

## Roadmap

### Phase 2 (Post-MVP)
- [ ] E2E tests with Playwright
- [ ] Performance budgets
- [ ] Feature flags integration
- [ ] Blue-green deployments

### Phase 3 (Scale)
- [ ] Kubernetes migration
- [ ] Terraform infrastructure
- [ ] Multi-region deployment
- [ ] Advanced observability

---

## License

AGPL-3.0 - See [LICENSE](LICENSE) for details.

---

**Maintained by**: MuslimEEN DevOps Team  
**Last Updated**: March 2026
