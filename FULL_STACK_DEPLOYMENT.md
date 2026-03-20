# Full Stack Deployment Guide

**PROJECT**: MuslimEEN (Backend + Frontend)  
**DATE**: 2026-03-20  
**STATUS**: 🚀 READY FOR DEPLOYMENT

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (Vercel)                            │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Next.js 14 + React + TypeScript                        │    │
│  │  Clerk Authentication (@clerk/nextjs)                   │    │
│  │  Sentry Error Tracking                                  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                         │                                       │
│                         ▼ API Calls                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Render)                             │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Express.js + TypeScript                                │    │
│  │  Clerk SDK (@clerk/clerk-sdk-node)                      │    │
│  │  PostgreSQL (Render)                                    │    │
│  │  Redis (Render)                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Pre-Deployment Checklist

### 1. Environment Setup

#### Backend Environment (Render)

Set in Render Dashboard:
```bash
# Clerk (Required)
CLERK_SECRET_KEY=sk_live_xxxxx
CLERK_PUBLISHABLE_KEY=pk_live_xxxxx
CLERK_WEBHOOK_SECRET=whsec_xxxxx

# Database (Auto-configured by Render)
DATABASE_URL=postgres://...

# Internal API
INTERNAL_API_KEY=xxxxx

# Monitoring
SENTRY_DSN=https://xxxxx
```

#### Frontend Environment (Vercel)

Set in Vercel Dashboard:
```bash
# Clerk (Required)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx
CLERK_SECRET_KEY=sk_live_xxxxx

# API (Required)
NEXT_PUBLIC_API_URL=https://muslimeen-api.onrender.com/api

# Site URL (Required)
NEXT_PUBLIC_BASE_URL=https://muslimeen.org
```

---

## Deployment Order

### Step 1: Deploy Backend

```bash
# Deploy backend to Render
npx ts-node scripts/deploy-backend.ts staging

# Verify backend
./scripts/verify-deployment.sh staging
```

**Verify Backend Health:**
```bash
curl https://muslimeen-api-staging.onrender.com/health
curl https://muslimeen-api-staging.onrender.com/api/health/auth
```

### Step 2: Deploy Frontend

```bash
# Deploy frontend to Vercel
./scripts/deploy-frontend.sh staging

# Verify frontend
./scripts/verify-frontend.sh staging
```

**Verify Frontend:**
```bash
curl https://muslimeen-staging.vercel.app
curl https://muslimeen-staging.vercel.app/login
```

### Step 3: Run Smoke Tests

1. **Visit staging site**: https://muslimeen-staging.vercel.app
2. **Check console**: No errors
3. **Test login**: Clerk UI loads
4. **Test registration**: With invite code
5. **Check API calls**: Network tab shows 200s

### Step 4: Production Deploy

```bash
# Backend
npx ts-node scripts/deploy-backend.ts production
./scripts/verify-deployment.sh production

# Frontend
./scripts/deploy-frontend.sh production
./scripts/verify-frontend.sh production
```

---

## Post-Deployment Verification

### Backend Checks

| Endpoint | Command | Expected |
|----------|---------|----------|
| Health | `GET /health` | `{"status": "healthy"}` |
| Auth Health | `GET /api/health/auth` | Clerk status OK |
| Ready | `GET /api/health/auth/ready` | `{"ready": true}` |

### Frontend Checks

| Check | URL | Expected |
|-------|-----|----------|
| Homepage | `/` | Loads without errors |
| Login | `/login` | Clerk UI visible |
| Console | DevTools | No red errors |
| API | `/api/health` | Proxies to backend |

---

## Rollback Plan

### If Backend Fails:

```bash
# Enable read-only mode
# Set SYSTEM_READ_ONLY=true in Render Dashboard

# Or rollback to previous build
# Render Dashboard > Manual Deploy > Previous Build
```

### If Frontend Fails:

```bash
# Rollback in Vercel
vercel rollback

# Or via Dashboard
# Vercel > Project > Deployments > Previous > Promote
```

---

## Monitoring

### Backend Monitoring

- **Render Dashboard**: https://dashboard.render.com
- **Logs**: `render logs --service muslimeen-api --follow`
- **Health**: `curl /api/health/auth`

### Frontend Monitoring

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Analytics**: Vercel > Project > Analytics
- **Errors**: Sentry Dashboard

### Key Metrics

| Metric | Alert Threshold |
|--------|-----------------|
| Backend Error Rate | > 0.5% |
| Frontend Load Time | > 3s |
| API Response Time | > 500ms |
| Auth Failures | > 1% |

---

## Troubleshooting

### Backend Won't Start

```bash
# Check logs
render logs --service muslimeen-api --follow

# Common issues:
# 1. Missing env vars
# 2. Database connection failed
# 3. Port already in use
```

### Frontend Won't Build

```bash
# Check locally
cd frontend
npm run build

# Common issues:
# 1. Missing env vars
# 2. TypeScript errors
# 3. Import errors
```

### Clerk Auth Not Working

**Check:**
1. Keys match between frontend/backend
2. Domain added to Clerk allowed origins
3. Webhook secret configured (backend)
4. URLs match in Clerk dashboard

---

## Support Contacts

| Issue | Contact |
|-------|---------|
| Render Deployment | support@render.com |
| Vercel Deployment | support@vercel.com |
| Clerk Auth | support@clerk.com |
| Internal Issues | [Your team contact] |

---

## Success Criteria

- ✅ Backend deployed and healthy
- ✅ Frontend deployed and accessible
- ✅ No console errors
- ✅ Clerk UI loads
- ✅ Auth flow works
- ✅ API calls succeed

---

## Final Checklist

- [ ] Backend env vars set in Render
- [ ] Frontend env vars set in Vercel
- [ ] Clerk domains configured
- [ ] Backend deployed to staging
- [ ] Frontend deployed to staging
- [ ] Smoke tests passed
- [ ] Backend deployed to production
- [ ] Frontend deployed to production
- [ ] Production smoke tests passed
- [ ] Monitoring dashboards checked

---

**🚀 SYSTEM READY FOR FULL DEPLOYMENT**

*End of Full Stack Deployment Guide*
