# 🚀 Quick Deployment Guide

Deploy MuslimEEN to production in 5 steps.

---

## Architecture

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

---

## Step 1: Neon Database (2 min)

1. Go to [neon.tech](https://neon.tech)
2. Create project: `muslimeen-prod`
3. Copy connection string
4. Run migrations:
   ```bash
   psql "<your-neon-connection-string>" -f backend/database/migrations/*.sql
   ```

---

## Step 2: Upstash Redis (2 min)

1. Go to [upstash.com](https://upstash.com)
2. Create database: `muslimeen-redis`
3. Copy Redis URL

---

## Step 3: Render Backend (5 min)

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click **New +** → **Web Service**
3. Connect your GitHub repo
4. Configure:
   - **Name**: `muslimeen-api`
   - **Root Directory**: `backend`
   - **Build**: `npm install && npm run build`
   - **Start**: `npm start`
5. Add environment variables (see below)
6. Click **Create Web Service**

### Required Env Vars for Render:

```env
NODE_ENV=production
DATABASE_URL=<neon-connection-string>
REDIS_URL=<upstash-redis-url>
JWT_SECRET=<generate-random-64-char-hex>
CSRF_SECRET=<generate-random-64-char-hex>
COOKIE_SECRET=<generate-random-64-char-hex>
FRONTEND_URL=<your-vercel-domain>.vercel.app
```

Generate secrets:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Step 4: Vercel Frontend (3 min)

1. Go to [vercel.com](https://vercel.com)
2. Click **Add New Project**
3. Import your GitHub repo
4. Configure:
   - **Framework**: Next.js
   - **Root Directory**: `frontend`
5. Add env var:
   ```env
   NEXT_PUBLIC_API_URL=https://<your-render-app>.onrender.com/api
   ```
6. Click **Deploy**

---

## Step 5: Verify (1 min)

```bash
# Test backend
curl https://<your-render-app>.onrender.com/api/health

# Test frontend
# Open https://<your-vercel-app>.vercel.app in browser
```

---

## 💰 Cost

| Service | Cost/Month |
|---------|------------|
| Vercel | Free ($0) |
| Render | Free ($0) |
| Neon | Free ($0) |
| Upstash | Free ($0) |
| **Total** | **$0** |

Free tier handles ~1000 users comfortably.

---

## 🛠 Local Development

### Option A: Docker (Recommended)

```bash
# Start everything
docker-compose up

# Access:
# Frontend: http://localhost:8080
# Backend:  http://localhost:3001
# Postgres: localhost:5432
# Redis:    localhost:6379
```

### Option B: Local Install

```bash
# 1. Install Postgres & Redis locally
# 2. Run migrations
psql -U postgres -d muslimeen -f backend/database/migrations/*.sql

# 3. Start backend
cd backend
npm install
cp .env.example .env  # Edit with your values
npm run dev

# 4. Start frontend (new terminal)
cd frontend
npm install
npm run dev
```

---

## 📁 Files Reference

| File | Purpose |
|------|---------|
| `render.yaml` | Render blueprint for infrastructure |
| `vercel.json` | Vercel configuration |
| `docker-compose.yml` | Local development stack |
| `DEPLOY.md` | Detailed deployment guide |
| `backend/.env.production.example` | Production env template |

---

## 🆘 Troubleshooting

### Database Connection Failed
- Check Neon dashboard → Connection Details
- Ensure `sslmode=require` in connection string
- Verify IP allowlist in Neon settings

### Redis Connection Failed
- Check Upstash dashboard for correct URL
- Ensure using `rediss://` (with SSL)

### CORS Errors
- Verify `FRONTEND_URL` in Render env vars
- Must match your Vercel domain exactly

### Build Failed
- Check Node.js version (18+ required)
- Check `npm install` logs for errors
- Ensure all env vars are set

---

## 📊 Monitoring

- **Render**: https://dashboard.render.com
- **Vercel**: https://vercel.com/dashboard
- **Neon**: https://console.neon.tech
- **Upstash**: https://console.upstash.com

---

**Deploy in 15 minutes!** 🚀
