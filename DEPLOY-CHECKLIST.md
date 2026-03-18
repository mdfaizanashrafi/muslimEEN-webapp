# MuslimEEN Production Deployment Checklist

Use this checklist before every production deployment.

## ✅ Pre-Deployment

### Environment Variables
- [ ] `NODE_ENV=production` is set
- [ ] `DATABASE_URL` points to production database
- [ ] `JWT_SECRET` is at least 64 characters and unique
- [ ] `COOKIE_SECRET` is at least 32 characters and unique
- [ ] `CSRF_SECRET` is at least 32 characters and unique
- [ ] `FRONTEND_URL` matches production domain
- [ ] `SENTRY_DSN` is configured (recommended)

### Security
- [ ] No secrets in code (use environment variables)
- [ ] CORS origins properly configured
- [ ] Rate limiting enabled
- [ ] Security headers configured
- [ ] CSP policy active

### Database
- [ ] All migrations run
- [ ] Database backups configured
- [ ] Connection pool size appropriate

### Monitoring
- [ ] Health endpoints accessible (/health, /health/ready)
- [ ] Logs aggregating to monitoring service
- [ ] Error tracking (Sentry) configured

## ✅ Deployment

### Backend (Render)
1. [ ] Push code to main branch
2. [ ] Verify build succeeds
3. [ ] Check startup logs for errors
4. [ ] Verify health endpoint responds 200
5. [ ] Run smoke tests

### Frontend (Vercel)
1. [ ] Environment variables set in Vercel dashboard
2. [ ] Build command: `npm run build`
3. [ ] Output directory: `.next`
4. [ ] Verify build succeeds
5. [ ] Check that API calls work

## ✅ Post-Deployment

### Smoke Tests
- [ ] Landing page loads
- [ ] Login page accessible
- [ ] Health check returns 200
- [ ] Invalid login shows error
- [ ] Protected routes redirect to login

### Monitoring
- [ ] No errors in Sentry
- [ ] No critical logs
- [ ] Response times normal (< 500ms)
- [ ] Database connections stable

### Rollback Plan
If issues detected:
1. [ ] Identify last known good version
2. [ ] Trigger rollback in Render/Vercel
3. [ ] Verify rollback success
4. [ ] Communicate to team

## 🚨 Emergency Contacts

- Primary: [Your Name] - [Your Email]
- Secondary: [Backup Contact]
- Infrastructure: Render/Vercel Support

---

**Last Updated:** 2026-03-18  
**Version:** 1.0.0
