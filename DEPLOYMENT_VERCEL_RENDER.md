# MuslimEEN Deployment Guide - Vercel + Render

This guide walks you through deploying the MuslimEEN application using:
- **Vercel** for the Next.js frontend
- **Render** for the Node.js/Express backend and PostgreSQL database

---

## Prerequisites

1. [GitHub](https://github.com) account with your code pushed to a repository
2. [Vercel](https://vercel.com) account (free tier available)
3. [Render](https://render.com) account (free tier available)

---

## Step 1: Deploy Backend to Render

### Option A: Deploy using Render Dashboard (Recommended for first time)

1. **Go to [Render Dashboard](https://dashboard.render.com)**

2. **Create PostgreSQL Database:**
   - Click "New" → "PostgreSQL"
   - Name: `muslimeen-db`
   - Database: `muslimeen`
   - User: `muslimeen`
   - Plan: Free (or Starter for production)
   - Click "Create Database"
   - Wait for the database to be provisioned (1-2 minutes)
   - Copy the "Internal Connection String" for later use

3. **Create Web Service:**
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Name: `muslimeen-api`
   - Runtime: Node
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Root Directory: `backend` ⚠️ IMPORTANT
   - Plan: Free (or Starter for production)
   
4. **Configure Environment Variables:**
   Add these environment variables in the Render dashboard:

   | Key | Value | Notes |
   |-----|-------|-------|
   | `NODE_ENV` | `production` | |
   | `PORT` | `3000` | |
   | `JWT_SECRET` | Generate a strong random string | Use 32+ characters |
   | `JWT_EXPIRES_IN` | `24h` | |
   | `BCRYPT_ROUNDS` | `12` | |
   | `CSRF_SECRET` | Generate a strong random string | |
   | `LOG_LEVEL` | `info` | |
   | `DB_HOST` | (from your PostgreSQL service) | Hostname |
   | `DB_PORT` | `5432` | |
   | `DB_NAME` | `muslimeen` | |
   | `DB_USER` | `muslimeen` | |
   | `DB_PASSWORD` | (from your PostgreSQL service) | Password |
   | `FRONTEND_URL` | `https://your-app.vercel.app` | Will update after Vercel deploy |

5. **Run Database Migrations:**
   - In Render dashboard, go to your Web Service
   - Click "Shell" tab
   - Run: `npm run migrate`
   - Or use SQL directly: `psql $DATABASE_URL -f database/migrations/001_initial_schema.sql`

6. **Copy the Service URL:**
   - After deployment, your API will be at: `https://muslimeen-api.onrender.com`
   - Save this URL for the frontend configuration

### Option B: Deploy using render.yaml (Infrastructure as Code)

1. **Push the `render.yaml` file** to your repository root

2. **Go to [Render Dashboard](https://dashboard.render.com)**

3. **Click "Blueprint" → "New Blueprint Instance"**

4. **Select your repository** with the `render.yaml` file

5. **Render will automatically:**
   - Create the PostgreSQL database
   - Create the web service
   - Link them together

6. **Update Environment Variables:**
   - After creation, manually add:
     - `JWT_SECRET` (generate a secure random string)
     - `CSRF_SECRET` (generate a secure random string)
   - Update `FRONTEND_URL` after Vercel deployment

---

## Step 2: Deploy Frontend to Vercel

### Option A: Deploy using Vercel Dashboard

1. **Go to [Vercel Dashboard](https://vercel.com)**

2. **Add New Project:**
   - Click "Add New..." → "Project"
   - Import your GitHub repository

3. **Configure Project:**
   - Framework Preset: Next.js
   - Root Directory: `frontend` ⚠️ IMPORTANT
   - Build Command: `npm run build` (default)
   - Output Directory: `dist` (as configured in next.config.js)

4. **Add Environment Variables:**
   
   | Key | Value |
   |-----|-------|
   | `NEXT_PUBLIC_API_URL` | `https://muslimeen-api.onrender.com/api` |

5. **Click "Deploy"**

6. **Wait for deployment** (2-3 minutes)

### Option B: Deploy using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to frontend directory
cd frontend

# Set environment variable
vercel env add NEXT_PUBLIC_API_URL
# Enter: https://muslimeen-api.onrender.com/api

# Deploy
vercel --prod
```

---

## Step 3: Update CORS Configuration

After your Vercel deployment is complete:

1. **Copy your Vercel URL**
   - Format: `https://your-project-name.vercel.app`

2. **Update Render Environment Variable:**
   - Go to Render Dashboard → Your Web Service → Environment
   - Add/Update: `FRONTEND_URL` = `https://your-project-name.vercel.app`
   - (Optional) `FRONTEND_URLS` = multiple URLs comma-separated
   - Click "Save Changes"
   - The service will auto-redeploy

---

## Step 4: Verify Deployment

### Test Backend:
```bash
curl https://muslimeen-api.onrender.com/health
```
Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-...",
  "version": "1.0.0",
  "environment": "production"
}
```

### Test Frontend:
1. Visit your Vercel URL
2. Open browser DevTools (F12)
3. Check Console for any API errors
4. Try logging in (if you have test credentials)

---

## Troubleshooting

### CORS Errors

If you see CORS errors in the browser console:

1. Verify `FRONTEND_URL` in Render matches your Vercel URL exactly
2. Check that the URL includes `https://` (not `http://`)
3. Ensure there's no trailing slash
4. Redeploy the backend after updating env vars

### Database Connection Errors

If the backend can't connect to the database:

1. Verify PostgreSQL service is running (Render dashboard)
2. Check database credentials in environment variables
3. Ensure migrations have been run
4. Check Render logs for specific error messages

### Build Failures

**Frontend:**
- Ensure `next.config.js` has `output: 'export'` for static sites
- Check that all dependencies are in `package.json`

**Backend:**
- Ensure `main` in `package.json` points to `dist/server.js`
- Verify TypeScript compiles without errors: `npm run type-check`

### API Not Found (404)

If frontend shows 404 for API calls:
- Verify `NEXT_PUBLIC_API_URL` includes `/api` at the end
- Check backend health endpoint is accessible

---

## Production Checklist

Before going live, ensure:

- [ ] Strong, unique `JWT_SECRET` (32+ random characters)
- [ ] Strong, unique `CSRF_SECRET` (32+ random characters)
- [ ] `NODE_ENV` set to `production`
- [ ] Database migrations run successfully
- [ ] CORS configured with correct frontend URL
- [ ] HTTPS enabled (Vercel and Render provide this by default)
- [ ] Environment variables not exposed in logs
- [ ] Rate limiting enabled (already in code)
- [ ] Health check endpoint responding

### Generate Secure Secrets

```bash
# For JWT_SECRET and CSRF_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Custom Domain Setup (Optional)

### Vercel Custom Domain:
1. Go to Project Settings → Domains
2. Add your domain
3. Follow DNS configuration instructions

### Render Custom Domain:
1. Go to Web Service Settings → Custom Domain
2. Add your domain
3. Update `FRONTEND_URL` to use custom domain

---

## Scaling (When Needed)

### Render Plans:
- **Free**: Sleep after 15 min inactivity, limited resources
- **Starter**: Always on, good for small production apps
- **Standard+**: More resources, better performance

### Vercel Plans:
- **Hobby**: Free tier with generous limits
- **Pro**: More bandwidth, team features

---

## Monitoring

### Render:
- Built-in logs and metrics in dashboard
- Integrate with Log Streams for external monitoring

### Vercel:
- Analytics available in dashboard
- Integrate with third-party monitoring (Sentry, etc.)

---

## Support

- **Render Docs**: https://render.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **MuslimEEN Issues**: Create an issue in your repository

---

**Happy Deploying! 🚀**
