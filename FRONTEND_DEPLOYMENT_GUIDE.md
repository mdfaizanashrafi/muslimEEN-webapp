# Frontend Deployment Guide

**PROJECT**: MuslimEEN Frontend (Next.js + Clerk)  
**PLATFORM**: Vercel  
**DATE**: 2026-03-20

---

## Overview

This guide covers deploying the MuslimEEN Next.js frontend to Vercel with Clerk authentication.

---

## Prerequisites

### 1. Vercel Account
- Sign up at https://vercel.com
- Install Vercel CLI: `npm i -g vercel`
- Login: `vercel login`

### 2. Environment Variables

Set these in Vercel Dashboard before deployment:

| Variable | Required | Source | Description |
|----------|----------|--------|-------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ✅ Yes | Clerk Dashboard | Frontend Clerk key |
| `CLERK_SECRET_KEY` | ✅ Yes | Clerk Dashboard | Backend Clerk key |
| `NEXT_PUBLIC_API_URL` | ✅ Yes | Your backend URL | Backend API URL |
| `NEXT_PUBLIC_BASE_URL` | ✅ Yes | Your domain | Production domain |
| `NEXT_PUBLIC_SENTRY_DSN` | ❌ No | Sentry | Error tracking |

### 3. Clerk Configuration

In Clerk Dashboard (https://dashboard.clerk.com):

1. **Configure URLs**:
   - Sign-in URL: `/login`
   - Sign-up URL: `/register`
   - After sign-in: `/dashboard`
   - After sign-up: `/dashboard`

2. **Allowed Origins**:
   - Add your production domain (e.g., `https://muslimeen.org`)
   - Add staging domain (e.g., `https://muslimeen-staging.vercel.app`)

---

## Deployment Methods

### Method 1: Automated Script (Recommended)

```bash
# Deploy to staging
./scripts/deploy-frontend.sh staging

# Deploy to production (requires confirmation)
./scripts/deploy-frontend.sh production
```

### Method 2: Vercel CLI

```bash
# Navigate to frontend
cd frontend

# Deploy to staging
vercel

# Deploy to production
vercel --prod
```

### Method 3: Git Integration

1. Push code to GitHub
2. Connect repo in Vercel Dashboard
3. Vercel auto-deploys on push

---

## Deployment Steps

### Step 1: Environment Setup

Create `.env.production` in `frontend/`:

```bash
# Backend API URL
NEXT_PUBLIC_API_URL=https://muslimeen-api.onrender.com/api

# Base URL
NEXT_PUBLIC_BASE_URL=https://muslimeen.org

# Clerk (get from Clerk Dashboard)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx
CLERK_SECRET_KEY=sk_live_xxxxx

# Optional: Analytics
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

### Step 2: Build Locally (Test)

```bash
cd frontend

# Install dependencies
npm install

# Build
npm run build

# If build fails, fix errors before deploying
```

### Step 3: Deploy

```bash
# Option A: Use deployment script
../scripts/deploy-frontend.sh production

# Option B: Use Vercel CLI
vercel --prod
```

### Step 4: Verify

```bash
# Run verification script
../scripts/verify-frontend.sh production
```

---

## Verification Checklist

After deployment, verify:

### ✅ Site Loads
```bash
curl https://muslimeen.org
# Should return 200 OK
```

### ✅ No Console Errors
- Open browser DevTools (F12)
- Go to Console tab
- Should see no red errors

### ✅ Clerk UI Loads
- Visit `/login`
- Should see Clerk sign-in form
- Check Network tab for Clerk requests (200 OK)

### ✅ API Connectivity
```bash
curl https://muslimeen.org/api/health
# Should proxy to backend and return health status
```

### ✅ Auth Flow Works
1. Visit `/register` (with invite code)
2. Complete signup
3. Should redirect to `/dashboard`

---

## Troubleshooting

### Issue: Build Fails

```bash
# Check locally
cd frontend
npm run build

# Common fixes:
# 1. Delete .next folder
rm -rf .next

# 2. Clear node_modules
rm -rf node_modules package-lock.json
npm install

# 3. Check for TypeScript errors
npx tsc --noEmit
```

### Issue: Clerk UI Not Loading

**Check**:
1. `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set in Vercel
2. Domain is added to Clerk allowed origins
3. Clerk URLs match your app routes

**Fix**:
```bash
# Check env vars in Vercel
vercel env ls

# Add missing vars
vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
```

### Issue: API Calls Failing

**Check**:
1. `NEXT_PUBLIC_API_URL` is correct
2. Backend CORS allows frontend domain
3. API health endpoint is accessible

**Fix**:
```bash
# Test API directly
curl $NEXT_PUBLIC_API_URL/health

# Check CORS in backend
# Should allow your frontend domain
```

### Issue: 404 on Pages

**Check**:
1. `next.config.js` has correct `trailingSlash` setting
2. Pages exist in `app/` directory
3. No case sensitivity issues

---

## Vercel Configuration

### `vercel.json`

```json
{
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/.next",
  "framework": "nextjs",
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "SAMEORIGIN"
        }
      ]
    }
  ]
}
```

### Important Settings

In Vercel Dashboard:

1. **Framework Preset**: Next.js
2. **Root Directory**: `frontend` (if monorepo)
3. **Build Command**: `npm run build`
4. **Output Directory**: `.next`

---

## Domain Configuration

### Custom Domain

1. Go to Vercel Dashboard > Project > Settings > Domains
2. Add your domain (e.g., `muslimeen.org`)
3. Follow DNS configuration instructions
4. Wait for SSL certificate provisioning

### Environment-Specific URLs

| Environment | URL | Clerk URLs |
|-------------|-----|------------|
| Production | `https://muslimeen.org` | Production keys |
| Staging | `https://staging.muslimeen.org` | Staging keys |
| Preview | `https://git-branch.vercel.app` | Development keys |

---

## Monitoring

### Vercel Analytics

Enable in Dashboard:
1. Project > Analytics > Enable
2. Shows: Core Web Vitals, Traffic, Errors

### Sentry Integration

Already configured in `layout.tsx`:
```typescript
import { ErrorBoundary } from "@/components/ErrorBoundary";
```

Set `NEXT_PUBLIC_SENTRY_DSN` to enable.

### Health Checks

```bash
# Automated verification
./scripts/verify-frontend.sh production

# Manual checks
curl -s https://muslimeen.org | grep -i "error" || echo "OK"
```

---

## Rollback

If deployment fails:

```bash
# Rollback in Vercel Dashboard
# Project > Deployments > Previous Deployment > Promote

# Or via CLI
vercel rollback
```

---

## Performance Optimization

### Build Output

```bash
# Analyze bundle size
cd frontend
npm run analyze
```

### Lighthouse Score

```bash
# Run Lighthouse
npx lighthouse https://muslimeen.org --output=json
```

### Expected Metrics

| Metric | Target |
|--------|--------|
| First Contentful Paint | < 1.5s |
| Largest Contentful Paint | < 2.5s |
| Time to Interactive | < 3.5s |
| Cumulative Layout Shift | < 0.1 |

---

## Quick Commands

```bash
# Deploy to production
./scripts/deploy-frontend.sh production

# Verify deployment
./scripts/verify-frontend.sh production

# Check Vercel logs
vercel logs --follow

# View deployments
vercel list
```

---

## Support

### Resources

- **Vercel Docs**: https://vercel.com/docs
- **Clerk Docs**: https://clerk.com/docs
- **Next.js Docs**: https://nextjs.org/docs

### Emergency Contacts

- **On-call**: [Add contact]
- **Vercel Support**: https://vercel.com/help
- **Clerk Support**: support@clerk.com

---

**DEPLOY WITH CONFIDENCE**

*End of Frontend Deployment Guide*
