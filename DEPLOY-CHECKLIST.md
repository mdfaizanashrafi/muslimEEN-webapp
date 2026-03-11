# Deployment Checklist

Print this and check off each item as you complete it.

---

## PRE-DEPLOYMENT

- [ ] All code committed and pushed to GitHub
- [ ] GitHub repository is public or you have access
- [ ] Accounts created: Neon, Upstash, Render, Vercel

---

## STEP 1: NEON DATABASE

**URL**: https://console.neon.tech

- [ ] Click "New Project"
- [ ] Name: `muslimeen-prod`
- [ ] Region selected (matching your users)
- [ ] Project created
- [ ] Clicked "Connection Details"
- [ ] Copied connection string to Notepad
- [ ] Ran all 6 migration files
- [ ] Verified with `SELECT 1;` query

**SAVE**: Connection string (starts with `postgresql://`)

---

## STEP 2: UPSTASH REDIS

**URL**: https://console.upstash.com

- [ ] Click "Create Database"
- [ ] Name: `muslimeen-redis`
- [ ] Region matches Neon
- [ ] Type: **Regional** (not Global)
- [ ] Database created
- [ ] Clicked "Details" tab
- [ ] Copied Redis Protocol URL

**SAVE**: Redis URL (starts with `rediss://`)

---

## STEP 3: RENDER BACKEND

**URL**: https://dashboard.render.com

### Create Service
- [ ] Clicked "New +" → "Web Service"
- [ ] Connected GitHub repository
- [ ] Selected repository
- [ ] Name: `muslimeen-api`
- [ ] Region matches Neon
- [ ] Branch: `main`
- [ ] Runtime: `Node`
- [ ] Build Command: `cd backend && npm install && npm run build`
- [ ] Start Command: `cd backend && npm start`
- [ ] Plan selected (Free or Starter)

### Environment Variables (12 total)
- [ ] NODE_ENV = `production`
- [ ] PORT = `10000`
- [ ] DATABASE_URL = (paste Neon string)
- [ ] REDIS_URL = (paste Upstash URL)
- [ ] JWT_SECRET = (generated 64-char hex)
- [ ] CSRF_SECRET = (generated 64-char hex)
- [ ] COOKIE_SECRET = (generated 64-char hex)
- [ ] BCRYPT_ROUNDS = `12`
- [ ] FRONTEND_URL = `https://muslimeen-yourname.vercel.app`
- [ ] LOG_LEVEL = `info`
- [ ] RATE_LIMIT_ENABLED = `true`
- [ ] JWT_EXPIRES_IN = `24h`

### Deploy
- [ ] Clicked "Create Web Service"
- [ ] Deployment successful (green checkmark)
- [ ] Copied service URL
- [ ] Tested `/api/health` endpoint

**SAVE**: Backend URL (like `https://muslimeen-api.onrender.com`)

---

## STEP 4: VERCEL FRONTEND

**URL**: https://vercel.com/dashboard

- [ ] Clicked "Add New Project"
- [ ] Imported Git Repository
- [ ] Selected repository
- [ ] Framework Preset: `Next.js`
- [ ] Root Directory: `frontend`
- [ ] Build settings correct
- [ ] Added Environment Variable:
  - [ ] Key: `NEXT_PUBLIC_API_URL`
  - [ ] Value: (paste Render backend URL + `/api`)
- [ ] Clicked "Deploy"
- [ ] Build successful
- [ ] Copied deployment URL
- [ ] Opened URL in browser
- [ ] Homepage loads correctly

**SAVE**: Frontend URL (like `https://muslimeen-yourname.vercel.app`)

---

## STEP 5: FINAL UPDATES

- [ ] Went back to Render dashboard
- [ ] Updated FRONTEND_URL with actual Vercel URL
- [ ] Service restarted successfully

---

## POST-DEPLOYMENT TESTING

- [ ] Frontend URL loads in browser
- [ ] `/api/health` returns OK
- [ ] Can register new account
- [ ] Can login
- [ ] Can view dashboard
- [ ] Trust score displays
- [ ] No CORS errors in browser console

---

## IMPORTANT URLS TO SAVE

| Service | URL | Your Value |
|---------|-----|------------|
| **Frontend** | Vercel URL | _________________________ |
| **Backend** | Render URL | _________________________ |
| **Health Check** | Render + /api/health | _________________________ |
| **Database** | Neon Console | https://console.neon.tech |
| **Redis** | Upstash Console | https://console.upstash.com |

---

## EMERGENCY CONTACTS

| Platform | Support URL |
|----------|-------------|
| Neon | https://neon.tech/docs |
| Upstash | https://docs.upstash.com |
| Render | https://render.com/docs |
| Vercel | https://vercel.com/docs |

---

## 🎉 COMPLETE!

All items checked? Your MuslimEEN app is live!

**Share these URLs with your team:**
- Production App: _________________________
- API Endpoint: _________________________
