# Sentry Setup Checklist - Vercel + Render + Neon + Upstash

## ✅ Configuration Status

| Component | Status | Location |
|-----------|--------|----------|
| Frontend Sentry DSN | ✅ Configured | `frontend/.env.production` |
| Backend Sentry DSN | ✅ Configured | `backend/.env.production` |
| Frontend Init | ✅ Auto | `frontend/lib/auth-context.tsx` |
| Backend Init | ✅ Auto | `backend/src/server.ts` |

---

## 🚀 Deployment Steps

### 1. Vercel (Frontend) Environment Variables

Go to [Vercel Dashboard](https://vercel.com/dashboard) → Your Project → Settings → Environment Variables

Add these **Production** environment variables:

```
NEXT_PUBLIC_API_URL=https://muslimeen-webapp-cutf.onrender.com/api
NEXT_PUBLIC_SENTRY_DSN=https://de4361229b1bee21d70480bf3382b2b1@o4511066862780416.ingest.us.sentry.io/4511066874773504
```

**Optional (add when ready):**
```
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_SEARCH_CONSOLE_VERIFICATION=your-code
```

---

### 2. Render (Backend) Environment Variables

Go to [Render Dashboard](https://dashboard.render.com) → Your Service → Environment

Add these **Environment Variables**:

```
NODE_ENV=production
PORT=10000
FRONTEND_URL=https://muslimeen-webapp.vercel.app
SENTRY_DSN=https://de4361229b1bee21d70480bf3382b2b1@o4511066862780416.ingest.us.sentry.io/4511066874773504
LOG_LEVEL=warn
```

**Database (Neon):**
```
DB_HOST=your-neon-host.aws.neon.tech
DB_PORT=5432
DB_NAME=neondb
DB_USER=neondb_owner
DB_PASSWORD=your-neon-password
```

**Security (generate new strong values!):**
```
JWT_SECRET=generate-with-crypto
CSRF_SECRET=generate-with-crypto
COOKIE_SECRET=generate-with-crypto
BCRYPT_ROUNDS=12
```

**Redis (Upstash):**
```
REDIS_URL=redis://default:password@your-upstash-url:6379
```

---

### 3. Neon + Upstash (No Sentry Config Needed)

These are infrastructure services - errors are captured by the backend Sentry:
- Neon (PostgreSQL) errors → Backend Sentry
- Upstash (Redis) errors → Backend Sentry

---

## 🔍 Verify Sentry Integration

### Test Frontend Errors
1. Open your deployed site (Vercel URL)
2. Open browser console
3. Run: `throw new Error('Test frontend error')`
4. Check [Sentry Dashboard](https://sentry.io) in 1-2 minutes

### Test Backend Errors
1. Trigger an API error (e.g., invalid login)
2. Or check Render logs for: `Sentry initialized successfully`
3. Check [Sentry Dashboard](https://sentry.io) for backend errors

---

## 📊 What Gets Tracked

### Frontend (Browser)
- JavaScript runtime errors
- Unhandled promise rejections
- API failures (automatic via auth-context)
- Performance traces (10% sampling in production)
- Session replays (on errors)

### Backend (Node.js)
- Unhandled exceptions
- API route errors
- Database query failures
- Authentication errors
- Performance traces

### User Context (Both)
- User ID (after login)
- Email
- Role
- URL where error occurred
- Browser/Device info

---

## 🔒 Security Features (Already Configured)

### Frontend (`frontend/lib/sentry.ts`)
- ✅ Cookies removed from error reports
- ✅ Authorization headers stripped
- ✅ URL params redacted (token, password, secret, code)
- ✅ Common browser extension errors ignored

### Backend (`backend/src/config/sentry.ts`)
- ✅ Cookie headers removed
- ✅ Authorization headers stripped
- ✅ Request data sanitized

---

## 🛠️ Troubleshooting

### Sentry Not Receiving Errors?

**Frontend:**
1. Check browser console: `Sentry DSN not configured` → Env var missing
2. Check Vercel env vars are set for **Production**
3. Verify DSN is correct (no typos)

**Backend:**
1. Check Render logs: `Sentry initialized successfully`
2. If not, check `SENTRY_DSN` env var
3. Verify DSN is correct

### Too Many Errors?

Adjust sampling rates in:
- Frontend: `frontend/lib/sentry.ts` → `tracesSampleRate`
- Backend: `backend/src/config/sentry.ts` → `tracesSampleRate`

---

## 📁 Files Modified

| File | Change |
|------|--------|
| `frontend/.env.production` | Added `NEXT_PUBLIC_SENTRY_DSN` |
| `frontend/.env.local` | Added (commented out for local dev) |
| `frontend/.env.example` | Added Sentry documentation |
| `backend/.env.production` | Added `SENTRY_DSN` |
| `backend/.env.example` | Added Sentry DSN |

---

## 🎯 Next Steps

1. ✅ **Add env vars to Vercel Dashboard**
2. ✅ **Add env vars to Render Dashboard**
3. ✅ **Deploy latest code**
4. ✅ **Test error tracking**
5. ✅ **Set up Sentry alerts** (in Sentry dashboard)

---

**Sentry Project URL:** https://de4361229b1bee21d70480bf3382b2b1@o4511066862780416.ingest.us.sentry.io/4511066874773504
