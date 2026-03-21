# Quick Deploy Reference Card

**Print this and keep it handy during deployment**

---

## 1️⃣ Clean Install (Run These First)

```bash
# Clean everything
rm -rf node_modules package-lock.json
rm -rf frontend/node_modules frontend/package-lock.json
rm -rf backend/node_modules backend/package-lock.json

# Reinstall
npm install
cd frontend && npm install && cd ..
cd backend && npm install && cd ..
```

---

## 2️⃣ Verify Versions

```bash
# Should show v6.x (NOT v7.x)
cd frontend && npm ls @clerk/nextjs

# Should show @clerk/backend (NOT @clerk/clerk-sdk-node)
cd backend && npm ls @clerk/backend
```

---

## 3️⃣ Environment Variables

### Vercel (Frontend)
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/register
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api
```

### Render (Backend)
```
DATABASE_URL=postgresql://...
CLERK_SECRET_KEY=sk_live_...
CLERK_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=https://your-frontend.vercel.app
USE_CLERK_WEBHOOKS=true
COOKIE_SECRET=your-random-32-char-secret
```

---

## 4️⃣ Quick Tests

```bash
# Frontend build
cd frontend && npm run build

# Backend build
cd backend && npm run build

# Backend type check
cd backend && npm run type-check
```

---

## 5️⃣ Clerk Webhook Setup

1. Go to https://dashboard.clerk.com
2. Select your application
3. Go to Webhooks → Add Endpoint
4. URL: `https://your-backend.onrender.com/api/webhooks/clerk`
5. Events: ✓ user.created, ✓ user.updated, ✓ user.deleted, ✓ session.created
6. Save and copy the Signing Secret
7. Add to Render: `CLERK_WEBHOOK_SECRET=whsec_...`

---

## 6️⃣ Troubleshooting

| Error | Fix |
|-------|-----|
| "@clerk/nextjs requires Next.js 15" | Check version is ^6.12.0, NOT ^7.x |
| "Cannot find module '@clerk/backend'" | Run `npm install` in backend folder |
| "CLERK_WEBHOOK_SECRET not configured" | Add to Render env vars |
| "Missing Clerk Secret Key" | Add CLERK_SECRET_KEY to both Vercel & Render |
| "Invalid webhook signature" | Copy correct secret from Clerk Dashboard |

---

## 7️⃣ Post-Deploy Checks

- [ ] Frontend loads at Vercel URL
- [ ] Backend health at `/api/health/auth` returns 200
- [ ] Can sign up with invite code
- [ ] Webhooks showing in Clerk Dashboard (delivered)
- [ ] No errors in Render logs

---

**Good luck! 🚀**
