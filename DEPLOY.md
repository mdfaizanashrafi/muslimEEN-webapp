# Deploy MuslimEEN to Production

## Platform Architecture

| Service | Provider | Purpose |
|---------|----------|---------|
| Frontend | Vercel | Next.js hosting, CDN, SSL |
| Backend | Render | Node.js/Express API |
| Database | Neon | Serverless PostgreSQL |
| Cache/Rate Limit | Upstash | Serverless Redis |

---

## 1. Neon Database Setup

### Create Database
1. Go to https://neon.tech
2. Sign up / Sign in
3. Click "New Project"
4. Name: `muslimeen-prod`
5. Region: Choose closest to your users (e.g., `us-east-1`)
6. Click "Create Project"

### Get Connection String
1. In Neon dashboard, click "Connection Details"
2. Copy the connection string (looks like):
   ```
   postgresql://user:password@host.neon.tech/muslimeen-prod?sslmode=require
   ```
3. Save this for later

### Run Migrations
```bash
# Install Neon CLI (optional)
npm install -g neonctl

# Or use psql directly
psql "postgresql://user:password@host.neon.tech/muslimeen-prod?sslmode=require" -f backend/database/migrations/001_initial_schema.sql
psql "postgresql://user:password@host.neon.tech/muslimeen-prod?sslmode=require" -f backend/database/migrations/002_invite_system_refactor.sql
psql "postgresql://user:password@host.neon.tech/muslimeen-prod?sslmode=require" -f backend/database/migrations/003_fix_schema_issues.sql
psql "postgresql://user:password@host.neon.tech/muslimeen-prod?sslmode=require" -f backend/database/migrations/004_add_performance_indexes.sql
psql "postgresql://user:password@host.neon.tech/muslimeen-prod?sslmode=require" -f backend/database/migrations/005_comprehensive_fixes.sql
psql "postgresql://user:password@host.neon.tech/muslimeen-prod?sslmode=require" -f backend/database/migrations/006_production_hardening.sql
```

---

## 2. Upstash Redis Setup

### Create Redis Database
1. Go to https://upstash.com
2. Sign up / Sign in
3. Click "Create Database"
4. Name: `muslimeen-redis`
5. Region: Same as Neon (e.g., `us-east-1`)
6. Type: **Regional** (not Global)
7. Click "Create"

### Get Connection URL
1. In Upstash dashboard, go to your database
2. Click "Details" tab
3. Copy the `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
   - Or use the Redis protocol URL: `rediss://default:password@host:port`

---

## 3. Render Backend Deployment

### Method A: Using Render Dashboard (Recommended)

1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `muslimeen-api`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free (or paid for production)

5. Add Environment Variables:
   ```
   NODE_ENV=production
   PORT=10000
   DATABASE_URL=<neon-connection-string>
   REDIS_URL=<upstash-redis-url>
   JWT_SECRET=<generate-random-secret>
   CSRF_SECRET=<generate-random-secret>
   COOKIE_SECRET=<generate-random-secret>
   FRONTEND_URL=https://your-vercel-domain.vercel.app
   ```

6. Click "Create Web Service"

### Method B: Using render.yaml (Blueprint)

1. Push `render.yaml` to your GitHub repository
2. In Render dashboard, click "Blueprints"
3. Click "New Blueprint Instance"
4. Select your repository
5. Render will automatically create:
   - PostgreSQL database (or use existing Neon)
   - Redis instance (or use existing Upstash)
   - Web service

---

## 4. Vercel Frontend Deployment

### Using Vercel Dashboard

1. Go to https://vercel.com
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

5. Add Environment Variable:
   ```
   NEXT_PUBLIC_API_URL=https://your-render-api.onrender.com/api
   ```

6. Click "Deploy"

### Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy frontend
cd frontend
vercel --prod

# Set environment variable
vercel env add NEXT_PUBLIC_API_URL
# Enter: https://your-render-api.onrender.com/api
```

---

## 5. Environment Variables Reference

### Backend (Render)

| Variable | Value | Source |
|----------|-------|--------|
| `NODE_ENV` | `production` | Manual |
| `PORT` | `10000` | Manual |
| `DATABASE_URL` | Connection string | Neon dashboard |
| `REDIS_URL` | Redis URL | Upstash dashboard |
| `JWT_SECRET` | Random 64-char hex | Generate |
| `CSRF_SECRET` | Random 64-char hex | Generate |
| `COOKIE_SECRET` | Random 64-char hex | Generate |
| `FRONTEND_URL` | Vercel domain | After Vercel deploy |
| `BCRYPT_ROUNDS` | `12` | Manual |

### Frontend (Vercel)

| Variable | Value | Source |
|----------|-------|--------|
| `NEXT_PUBLIC_API_URL` | Render API URL | After Render deploy |

---

## 6. Generate Secrets

```bash
# Generate JWT Secret (64 character hex = 256 bits)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate CSRF Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate Cookie Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 7. Verify Deployment

### Test Backend
```bash
# Health check
curl https://your-render-api.onrender.com/api/health

# Should return:
# {"status":"ok","timestamp":"2026-03-07T..."}
```

### Test Frontend
1. Open your Vercel domain: `https://your-app.vercel.app`
2. Verify page loads
3. Test login/register flow

### Test Database Connection
```bash
# Via backend logs (Render dashboard → Logs)
# Should see: "Database connected successfully"
```

---

## 8. Custom Domain Setup (Optional)

### Backend (Render)
1. In Render dashboard, go to your web service
2. Click "Settings" → "Custom Domain"
3. Add your domain: `api.yourdomain.com`
4. Follow DNS instructions

### Frontend (Vercel)
1. In Vercel dashboard, go to your project
2. Click "Settings" → "Domains"
3. Add your domain: `app.yourdomain.com`
4. Follow DNS instructions

---

## 9. Monitoring & Logs

### Render Logs
- Dashboard: https://dashboard.render.com
- Real-time logs in web service page
- Can stream logs: `render logs --service muslimeen-api`

### Vercel Analytics
- Dashboard: https://vercel.com/dashboard
- Built-in analytics for performance
- Error tracking

### Neon Metrics
- Dashboard: https://console.neon.tech
- Connection metrics
- Query performance

### Upstash Metrics
- Dashboard: https://console.upstash.com
- Request metrics
- Memory usage

---

## 10. Troubleshooting

### Database Connection Issues
```bash
# Test Neon connection from local
psql "<neon-connection-string>" -c "SELECT 1;"

# Check if IP is allowed (Neon → Project Settings → IP Allow)
```

### Redis Connection Issues
```bash
# Test Upstash connection
redis-cli -u "<upstash-redis-url>" PING
# Should return: PONG
```

### CORS Errors
- Ensure `FRONTEND_URL` is set correctly in Render
- Check if frontend domain is in CORS whitelist

### Build Failures
- Check Node.js version (should be 18+)
- Check `npm install` output for errors
- Verify all env vars are set

---

## Cost Estimation (Monthly)

| Service | Plan | Cost |
|---------|------|------|
| Vercel | Pro (if needed) | $20 |
| Render | Starter | $7 |
| Neon | Free Tier | $0 |
| Upstash | Free Tier | $0 |
| **Total** | | **$27/mo** |

Free tier should handle:
- ~1000 users
- ~10K requests/day
- Sufficient for MVP/early stage

---

## Deployment Checklist

- [ ] Neon database created
- [ ] Database migrations run
- [ ] Upstash Redis created
- [ ] Render web service deployed
- [ ] Vercel frontend deployed
- [ ] Environment variables configured
- [ ] Secrets generated
- [ ] Health check passing
- [ ] Frontend loading correctly
- [ ] Login/register working
- [ ] Custom domain (optional)

---

**Ready to deploy!** 🚀
