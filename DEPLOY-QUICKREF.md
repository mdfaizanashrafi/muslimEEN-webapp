# Deployment Quick Reference

## Generate Secrets (Run 3 times)

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Each run produces a different 64-character hex string.

---

## Service URLs

| Service | Dashboard URL | What It Does |
|---------|---------------|--------------|
| **Neon** | https://console.neon.tech | PostgreSQL database |
| **Upstash** | https://console.upstash.com | Redis cache & rate limiting |
| **Render** | https://dashboard.render.com | Node.js backend API |
| **Vercel** | https://vercel.com/dashboard | Next.js frontend |

---

## Exact Environment Variables

### Render Backend (12 variables)

```
NODE_ENV=production
PORT=10000
DATABASE_URL=postgresql://user:pass@host.neon.tech/db?sslmode=require
REDIS_URL=rediss://default:pass@host.upstash.io:6379
JWT_SECRET=<64-char-hex>
CSRF_SECRET=<64-char-hex>
COOKIE_SECRET=<64-char-hex>
BCRYPT_ROUNDS=12
FRONTEND_URL=https://your-app.vercel.app
LOG_LEVEL=info
RATE_LIMIT_ENABLED=true
JWT_EXPIRES_IN=24h
```

### Vercel Frontend (1 variable)

```
NEXT_PUBLIC_API_URL=https://your-api.onrender.com/api
```

---

## Build Commands

### Render Backend
```
Build:  cd backend && npm install && npm run build
Start:  cd backend && npm start
```

### Vercel Frontend
```
Framework: Next.js
Root:      frontend
Build:     npm run build
Output:    dist
```

---

## Test Commands

```bash
# Test backend health
curl https://your-api.onrender.com/api/health

# Test with data (registration)
curl -X POST https://your-api.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Pass123!","firstName":"Test","lastName":"User","invitationCode":"TEST12345678"}'
```

---

## Migration Files (Run in order)

```bash
psql "<neon-connection-string>" -f 001_initial_schema.sql
psql "<neon-connection-string>" -f 002_invite_system_refactor.sql
psql "<neon-connection-string>" -f 003_fix_schema_issues.sql
psql "<neon-connection-string>" -f 004_add_performance_indexes.sql
psql "<neon-connection-string>" -f 005_comprehensive_fixes.sql
psql "<neon-connection-string>" -f 006_production_hardening.sql
```

---

## Architecture Summary

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     Vercel      │────▶│     Render      │────▶│      Neon       │
│   (Frontend)    │     │    (Backend)    │     │   (Database)    │
│   Next.js App   │     │  Express API    │     │  PostgreSQL     │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │     Upstash     │
                        │     (Redis)     │
                        │ Rate Limiting   │
                        └─────────────────┘
```

**Data Flow:**
1. User visits Vercel frontend
2. Frontend calls Render backend API
3. Backend queries Neon database
4. Backend uses Upstash for rate limiting/cache

---

## Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| CORS error | Update FRONTEND_URL in Render to match Vercel URL |
| DB connection failed | Check `?sslmode=require` in DATABASE_URL |
| Redis connection failed | Ensure URL starts with `rediss://` (double s) |
| Build failed | Check Node.js version is 18+ |
| 404 on API | Check backend is deployed and healthy |

---

## Free Tier Limits

| Service | Limit | Enough For |
|---------|-------|------------|
| Neon | 500MB storage | 10K users |
| Upstash | 10K commands/day | 1K users/day |
| Render | 512MB RAM, sleeps after 15min | Testing/small apps |
| Vercel | 100GB bandwidth | Most apps |

**To handle more traffic:**
- Render: Upgrade to Starter ($7/mo)
- Neon: Pro plan ($19/mo)
- Upstash: Pay-as-you-go (~$10/mo for 100K commands/day)

---

## Need Help?

1. Check `DEPLOY-STEP-BY-STEP.md` for detailed instructions
2. Check `DEPLOY-CHECKLIST.md` to track progress
3. Check service documentation:
   - Neon: https://neon.tech/docs
   - Upstash: https://docs.upstash.com
   - Render: https://render.com/docs
   - Vercel: https://vercel.com/docs
