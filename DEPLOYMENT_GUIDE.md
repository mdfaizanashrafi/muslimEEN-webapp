# Backend Deployment Guide

**PROJECT**: MuslimEEN Backend Service  
**DATE**: 2026-03-20  
**PLATFORM**: Render (Node.js)

---

## Overview

This guide provides step-by-step instructions for deploying the MuslimEEN backend service with zero downtime.

---

## Prerequisites

### 1. Environment Variables

Set these in Render Dashboard before first deployment:

| Variable | Required | Source |
|----------|----------|--------|
| `CLERK_SECRET_KEY` | ✅ Required | Clerk Dashboard > API Keys |
| `CLERK_PUBLISHABLE_KEY` | ✅ Required | Clerk Dashboard > API Keys |
| `CLERK_WEBHOOK_SECRET` | ✅ Required | Clerk Dashboard > Webhooks |
| `SENTRY_DSN` | ✅ Required | Sentry Project Settings |
| `INTERNAL_API_KEY` | ✅ Required | Run `create-api-key.ts` script |

### 2. Clerk Webhook Configuration

In Clerk Dashboard:
1. Go to **Webhooks**
2. Add endpoint: `https://your-api.com/api/webhooks/clerk`
3. Select events: `user.created`, `user.updated`, `user.deleted`, `session.created`
4. Copy signing secret to `CLERK_WEBHOOK_SECRET`

### 3. Database

Render PostgreSQL is configured in `render.yaml`:
- Database: `muslimeen-db`
- User: `muslimeen`
- Plan: Standard (or Free for testing)

---

## Deployment Methods

### Method 1: Automated Script (Recommended)

```bash
# Deploy to staging
npx ts-node scripts/deploy-backend.ts staging

# Deploy to production (requires confirmation)
npx ts-node scripts/deploy-backend.ts production
```

### Method 2: Render Dashboard

1. Connect GitHub repo to Render
2. Select `render.yaml` blueprint
3. Set environment variables
4. Click "Apply"
5. Service deploys automatically

### Method 3: Render CLI

```bash
# Install Render CLI
npm install -g @render/cli

# Login
render login

# Deploy
render deploy --service muslimeen-api
```

---

## Deployment Process

### Step 1: Pre-Deployment Checks

```bash
# Run verification
cd backend
npm run build
npx tsc --noEmit

# Run pre-deployment check
npx ts-node ../scripts/pre-deployment-check.ts
```

### Step 2: Deploy

```bash
# Option A: Deploy via script
npx ts-node scripts/deploy-backend.ts staging

# Option B: Deploy via Render Dashboard
# Go to: https://dashboard.render.com/web/services/muslimeen-api
# Click "Manual Deploy" > "Deploy latest commit"
```

### Step 3: Monitor Deployment

```bash
# Watch deployment logs
render logs --service muslimeen-api --follow

# Or via dashboard
# https://dashboard.render.com/web/services/muslimeen-api/logs
```

### Step 4: Verify Deployment

```bash
# Run verification script
./scripts/verify-deployment.sh staging

# Or manually check endpoints
curl https://muslimeen-api-staging.onrender.com/health
curl https://muslimeen-api-staging.onrender.com/api/health/auth
curl https://muslimeen-api-staging.onrender.com/api/health/auth/ready
```

---

## Health Endpoints

### After Deployment, Verify These Endpoints:

| Endpoint | Expected Response |
|----------|-------------------|
| `GET /health` | `{"status": "healthy", ...}` |
| `GET /api/health/auth` | `{"success": true, "status": "healthy", "auth": {...}}` |
| `GET /api/health/auth/ready` | `{"ready": true, ...}` |
| `GET /status` | `{"status": "ok", ...}` |

### Example Verification:

```bash
# Basic health
curl https://muslimeen-api.onrender.com/health | jq

# Auth system health
curl https://muslimeen-api.onrender.com/api/health/auth | jq

# Check specific values
curl -s https://muslimeen-api.onrender.com/api/health/auth | jq '.auth.system'
# Expected: "clerk"

curl -s https://muslimeen-api.onrender.com/api/health/auth | jq '.legacy.detections_24h'
# Expected: { "jwt": 0, "csrf": 0, "cookies": 0 }
```

---

## Zero-Downtime Deployment

Render provides zero-downtime deployments by default:

1. **New Instance Started**: Render starts new instance with new code
2. **Health Check**: New instance must pass health check
3. **Traffic Switch**: Once healthy, traffic switches to new instance
4. **Old Instance Stopped**: Previous instance is gracefully stopped

### If Deployment Fails:

1. Check logs in Render Dashboard
2. Verify environment variables
3. Test locally: `npm run build && npm start`
4. Fix issues and redeploy

---

## Rollback Procedure

### Immediate Rollback (If Issues Detected):

```bash
# Enable read-only mode (prevents data changes)
# Set SYSTEM_READ_ONLY=true in Render Dashboard
# Redeploy

# Or roll back to previous build
# Render Dashboard > muslimeen-api > Manual Deploy > Previous Build
```

### Database Rollback (If Needed):

```bash
# Restore from backup (if available)
pg_restore --dbname=$DATABASE_URL backup_file.sql
```

---

## Monitoring

### After Deployment, Monitor:

1. **Render Dashboard**: https://dashboard.render.com/web/services/muslimeen-api
   - CPU/Memory usage
   - Response times
   - Error rates

2. **Sentry**: https://sentry.io/organizations/your-org/projects/muslimeen/
   - Error tracking
   - Performance monitoring

3. **Health Checks**:
   ```bash
   # Run every 5 minutes
   watch -n 300 './scripts/verify-deployment.sh production'
   ```

---

## Troubleshooting

### Issue: Build Fails

```bash
# Check locally
cd backend
npm ci
npm run build

# Common fixes:
# 1. Delete node_modules and package-lock.json
# 2. Run npm install
# 3. Commit package-lock.json
```

### Issue: Environment Variables Missing

```bash
# Check render.yaml is correct
# Verify in Render Dashboard: Settings > Environment Variables
```

### Issue: Database Connection Fails

```bash
# Test connection locally
psql $DATABASE_URL -c "SELECT 1;"

# Check Render Dashboard: Database connection info
```

### Issue: Clerk Webhooks Not Working

```bash
# Verify webhook secret is correct
# Check Clerk Dashboard: Webhooks > Endpoint > Signing Secret
# Check logs for webhook errors
```

---

## Production Deployment Checklist

Before deploying to production:

- [ ] All staging tests passed
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Clerk webhooks configured
- [ ] Sentry DSN configured
- [ ] Internal API key generated
- [ ] Build passes locally
- [ ] Team notified of deployment window
- [ ] Rollback plan documented
- [ ] Monitoring dashboards ready

---

## Scripts Reference

| Script | Purpose |
|--------|---------|
| `scripts/deploy-backend.ts` | Main deployment script |
| `scripts/verify-deployment.sh` | Post-deployment verification |
| `scripts/pre-deployment-check.ts` | Pre-deployment validation |
| `scripts/create-api-key.ts` | Generate internal API key |

---

## Quick Commands

```bash
# Deploy to staging
npx ts-node scripts/deploy-backend.ts staging

# Deploy to production
npx ts-node scripts/deploy-backend.ts production

# Verify deployment
./scripts/verify-deployment.sh staging

# Create API key
npx ts-node backend/scripts/create-api-key.ts --name="Production Service" --scope=admin

# Check logs
render logs --service muslimeen-api --follow
```

---

**DEPLOY WITH CONFIDENCE**

*End of Deployment Guide*
