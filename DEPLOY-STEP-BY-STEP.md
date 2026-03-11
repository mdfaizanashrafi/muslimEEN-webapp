# Step-by-Step Deployment Guide

**Complete walkthrough with exact values and settings.**

---

## STEP 1: Neon Database (5 minutes)

### 1.1 Create Project
1. Go to https://console.neon.tech
2. Click **"New Project"**
3. **Project Name**: `muslimeen-prod`
4. **PostgreSQL Version**: 14
5. **Region**: Choose closest to your users
   - US users: `US East (N. Virginia)`
   - EU users: `EU (Frankfurt)`
   - Asia users: `Asia Pacific (Singapore)`
6. Click **"Create Project"**

### 1.2 Get Connection String
1. In project dashboard, click **"Connection Details"**
2. Find the connection string, looks like:
   ```
   postgresql://alex:AbC123dEf@ep-cool-river-123456.us-east-1.aws.neon.tech/muslimeen-prod?sslmode=require
   ```
3. **Copy this string** → Save to Notepad

### 1.3 Create Tables (Run Migrations)

**Option A: Using psql CLI**
```bash
# Install psql if needed, then run:
psql "postgresql://alex:AbC123dEf@ep-cool-river-123456.us-east-1.aws.neon.tech/muslimeen-prod?sslmode=require" -f backend/database/migrations/001_initial_schema.sql

psql "postgresql://alex:AbC123dEf@ep-cool-river-123456.us-east-1.aws.neon.tech/muslimeen-prod?sslmode=require" -f backend/database/migrations/002_invite_system_refactor.sql

psql "postgresql://alex:AbC123dEf@ep-cool-river-123456.us-east-1.aws.neon.tech/muslimeen-prod?sslmode=require" -f backend/database/migrations/003_fix_schema_issues.sql

psql "postgresql://alex:AbC123dEf@ep-cool-river-123456.us-east-1.aws.neon.tech/muslimeen-prod?sslmode=require" -f backend/database/migrations/004_add_performance_indexes.sql

psql "postgresql://alex:AbC123dEf@ep-cool-river-123456.us-east-1.aws.neon.tech/muslimeen-prod?sslmode=require" -f backend/database/migrations/005_comprehensive_fixes.sql

psql "postgresql://alex:AbC123dEf@ep-cool-river-123456.us-east-1.aws.neon.tech/muslimeen-prod?sslmode=require" -f backend/database/migrations/006_production_hardening.sql
```

**Option B: Using Neon SQL Editor**
1. In Neon dashboard, click **"SQL Editor"**
2. Copy contents of each migration file
3. Paste and run one by one

### 1.4 Verify Database
1. In SQL Editor, run:
   ```sql
   SELECT COUNT(*) FROM users;
   ```
2. Should return `0` (empty table, ready for users)

**✅ NEON DONE - Save the connection string for later**

---

## STEP 2: Upstash Redis (3 minutes)

### 2.1 Create Database
1. Go to https://console.upstash.com
2. Click **"Create Database"**
3. **Name**: `muslimeen-redis`
4. **Region**: Same as Neon (for low latency)
   - If Neon is US East → Select `us-east-1`
5. **Type**: **Regional** (NOT Global)
6. Click **"Create"**

### 2.2 Get Connection URL
1. Click on your database `muslimeen-redis`
2. Go to **"Details"** tab
3. Find **Redis Protocol URL**:
   ```
   rediss://default:a1b2c3d4e5f6@us1-muslimeen-redis-12345.upstash.io:6379
   ```
4. **Copy this URL** → Save to Notepad

### 2.3 Test Connection (Optional)
```bash
# Install redis-cli if needed, then:
redis-cli -u "rediss://default:a1b2c3d4e5f6@us1-muslimeen-redis-12345.upstash.io:6379" PING
# Should return: PONG
```

**✅ UPSTASH DONE - Save the Redis URL for later**

---

## STEP 3: Render Backend (10 minutes)

### 3.1 Create Web Service
1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Click **"Build and deploy from a Git repository"**
4. **Connect GitHub**: Click "Connect" and authorize
5. Select your repository: `your-username/muslimeen` (or your repo name)
6. Click **"Connect"**

### 3.2 Configure Service

Fill in these exact values:

| Field | Value |
|-------|-------|
| **Name** | `muslimeen-api` |
| **Region** | Same as Neon (e.g., `Oregon (US West)` for US) |
| **Branch** | `main` (or your default branch) |
| **Runtime** | `Node` |
| **Build Command** | `cd backend && npm install && npm run build` |
| **Start Command** | `cd backend && npm start` |
| **Plan** | `Free` (or Starter for $7/mo for better performance) |

### 3.3 Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**

Add these **12 variables** one by one:

```
Key: NODE_ENV
Value: production

Key: PORT
Value: 10000

Key: DATABASE_URL
Value: <paste-your-neon-connection-string>

Key: REDIS_URL
Value: <paste-your-upstash-redis-url>

Key: JWT_SECRET
Value: <generate-random-64-char-hex>

Key: CSRF_SECRET
Value: <generate-random-64-char-hex>

Key: COOKIE_SECRET
Value: <generate-random-64-char-hex>

Key: BCRYPT_ROUNDS
Value: 12

Key: FRONTEND_URL
Value: https://muslimeen-yourname.vercel.app
(Use your planned Vercel URL - we'll update if different)

Key: LOG_LEVEL
Value: info

Key: RATE_LIMIT_ENABLED
Value: true

Key: JWT_EXPIRES_IN
Value: 24h
```

### 3.4 Generate Secrets

Run this command **3 times** in your terminal:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Each run generates a different 64-character string. Use each for JWT_SECRET, CSRF_SECRET, and COOKIE_SECRET.

### 3.5 Create Service
1. Click **"Create Web Service"**
2. Wait for deployment (2-3 minutes)
3. You'll get a URL like: `https://muslimeen-api.onrender.com`
4. **Copy this URL** → Save to Notepad

### 3.6 Verify Backend
1. Open browser: `https://muslimeen-api.onrender.com/api/health`
2. Should see: `{"status":"ok","timestamp":"..."}`

**✅ RENDER DONE - Save the backend URL for Vercel**

---

## STEP 4: Vercel Frontend (5 minutes)

### 4.1 Create Project
1. Go to https://vercel.com/dashboard
2. Click **"Add New Project"**
3. Click **"Import Git Repository"**
4. Select your repository: `your-username/muslimeen`
5. Click **"Import"**

### 4.2 Configure Project

**Framework Preset**: `Next.js`

**Root Directory**: Click **"Edit"** → Type `frontend` → Click **"OK"**

Build settings should auto-populate:
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

### 4.3 Add Environment Variable

Click **"Environment Variables"** → **"Add"**

```
Key: NEXT_PUBLIC_API_URL
Value: https://muslimeen-api.onrender.com/api
(Use your actual Render backend URL)
```

### 4.4 Deploy
1. Click **"Deploy"**
2. Wait for build (2-3 minutes)
3. You'll get a URL like: `https://muslimeen-yourname.vercel.app`

### 4.5 Verify Frontend
1. Open your Vercel URL
2. Should see the MuslimEEN homepage
3. Try to register/login

**✅ VERCEL DONE**

---

## STEP 5: Update Render with Correct Frontend URL

### 5.1 Update FRONTEND_URL
1. Go back to https://dashboard.render.com
2. Click your service `muslimeen-api`
3. Click **"Environment"** tab
4. Find `FRONTEND_URL`
5. Click **Edit** → Change to your actual Vercel URL:
   ```
   https://muslimeen-yourname.vercel.app
   ```
6. Click **Save Changes**
7. Service will auto-restart

---

## FINAL VERIFICATION

### Test These URLs:

```bash
# 1. Backend Health
curl https://muslimeen-api.onrender.com/api/health
# Expected: {"status":"ok","timestamp":"..."}

# 2. Frontend Loads
# Open: https://muslimeen-yourname.vercel.app
# Should show homepage

# 3. Registration Flow
# - Click "Request Invitation" or use invite code
# - Register new account
# - Login
# - Should see dashboard
```

---

## COMPLETE ENVIRONMENT VARIABLES REFERENCE

### Render (Backend) - 12 Variables

```env
NODE_ENV=production
PORT=10000
DATABASE_URL=postgresql://alex:AbC123dEf@ep-cool-river-123456.us-east-1.aws.neon.tech/muslimeen-prod?sslmode=require
REDIS_URL=rediss://default:a1b2c3d4e5f6@us1-muslimeen-redis-12345.upstash.io:6379
JWT_SECRET=37ac1af27ac3bd871ebbcebb2134960e1a0921e75c7e716c2d4f0d368d2b3600
CSRF_SECRET=48bd2bf38ad9ce912fccdecc3245871f2b1032f86d8e817d3e5f1e479e3c4711
COOKIE_SECRET=59ce3cf49be0df023addfedd4356982g3c2143g97e9f928e4f6g2g580f4g5822
BCRYPT_ROUNDS=12
FRONTEND_URL=https://muslimeen-yourname.vercel.app
LOG_LEVEL=info
RATE_LIMIT_ENABLED=true
JWT_EXPIRES_IN=24h
```

### Vercel (Frontend) - 1 Variable

```env
NEXT_PUBLIC_API_URL=https://muslimeen-api.onrender.com/api
```

---

## TROUBLESHOOTING

### "Build Failed" on Render
1. Check logs in Render dashboard → Logs tab
2. Common fixes:
   - Ensure all env vars are set
   - Make sure `cd backend` is in build/start commands
   - Check Node.js version (should be 18+)

### "Database Connection Error"
1. Verify DATABASE_URL is correct
2. Check Neon dashboard → "Connection Details"
3. Ensure `?sslmode=require` is at the end of URL

### "CORS Error" in Browser
1. Check FRONTEND_URL in Render matches your Vercel URL exactly
2. Must include `https://` (not http)
3. No trailing slash

### "Redis Connection Error"
1. Check REDIS_URL is correct
2. Must start with `rediss://` (with double s for SSL)
3. Verify in Upstash dashboard

---

## 🎉 DEPLOYMENT COMPLETE!

Your MuslimEEN app is now live:

| Component | URL | Status |
|-----------|-----|--------|
| **Frontend** | https://muslimeen-yourname.vercel.app | ✅ Live |
| **Backend** | https://muslimeen-api.onrender.com | ✅ Live |
| **Database** | Neon (managed) | ✅ Connected |
| **Cache** | Upstash (managed) | ✅ Connected |

**Next steps:**
1. Create your admin account
2. Generate invite codes
3. Start inviting users!
