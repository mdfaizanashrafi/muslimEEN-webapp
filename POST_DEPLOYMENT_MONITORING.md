# Post-Deployment Monitoring Guide

**PROJECT**: MuslimEEN Full Stack  
**DATE**: 2026-03-20  
**PHASE**: Critical (First 30 Minutes)

---

## Overview

This guide covers monitoring the system immediately after deployment to detect and respond to issues in real-time.

**⚠️ WARNING**: Do not leave the system unattended during the first 30 minutes after production deployment.

---

## Monitoring Timeline

### Immediate (0-5 minutes)
- ✅ Deployment completes
- ✅ Health checks pass
- ✅ Basic smoke tests

### Short-term (5-30 minutes)
- 🔄 Continuous health monitoring
- 🔄 Error rate tracking
- 🔄 Performance metrics
- 🔄 User traffic observation

### Long-term (30+ minutes)
- 📊 Analytics review
- 📊 Error patterns
- 📊 Performance trends

---

## Automated Monitoring

### Real-Time Monitor Script

```bash
# Start monitoring (runs for 30 minutes)
npx ts-node scripts/monitor-deployment.ts production
```

**What it monitors:**
- Backend health every 30 seconds
- Frontend health every 30 seconds
- Response times
- Error rates
- Auth failures

**Alert thresholds:**
- Error rate > 1%
- Response time > 2000ms
- Auth failures > 5%

### Log Analysis

```bash
# Analyze backend logs
./scripts/analyze-logs.sh backend production

# Analyze frontend logs
./scripts/analyze-logs.sh frontend production
```

---

## Manual Checks

### 1. Health Endpoints (Every 2 minutes for 10 minutes)

```bash
# Backend health
curl https://muslimeen-api.onrender.com/api/health/auth | jq

# Expected:
# {
#   "success": true,
#   "status": "healthy",
#   "auth": { "system": "clerk" }
# }

# Frontend health
curl https://muslimeen.org/health

# Expected:
# { "status": "ok" }
```

### 2. Browser Testing

**Test in multiple browsers:**
- Chrome
- Firefox
- Safari
- Mobile (iOS Safari)

**Test these flows:**
1. Visit homepage
2. Navigate to login
3. Check console for errors
4. Test responsive design
5. Test auth flow (if safe)

### 3. Sentry Dashboard

**URL**: https://sentry.io/organizations/your-org/projects/muslimeen/

**Watch for:**
- New error groups
- Spike in error volume
- Auth-related errors
- API errors

**Alert thresholds:**
- > 10 new errors in 5 minutes
- Auth failure rate > 1%
- Any critical/unhandled errors

### 4. Render Dashboard (Backend)

**URL**: https://dashboard.render.com/web/services/muslimeen-api

**Monitor:**
- CPU usage (< 80%)
- Memory usage (< 85%)
- Response times (< 500ms p95)
- Error rate (< 1%)

### 5. Vercel Dashboard (Frontend)

**URL**: https://vercel.com/dashboard

**Monitor:**
- Build status
- Deployment status
- Edge function errors
- Analytics

---

## Alert Response Procedures

### 🔴 CRITICAL: Site Down

**Symptoms:**
- Health endpoint returns 5xx
- Site not loading
- Error rate spike

**Actions:**
1. **Immediate** - Enable read-only mode
   ```bash
   # Set SYSTEM_READ_ONLY=true in Render Dashboard
   # Redeploy
   ```

2. **Within 2 minutes** - Rollback decision
   - Check: Is this a new issue?
   - Check: Can it be fixed quickly?
   - If NO → Rollback immediately

3. **Rollback command:**
   ```bash
   # Render Dashboard > muslimeen-api > Manual Deploy > Previous Build
   # Vercel Dashboard > Project > Deployments > Previous > Promote
   ```

### 🟠 HIGH: Auth Failures

**Symptoms:**
- Users can't login
- Clerk errors in Sentry
- Auth endpoint errors

**Actions:**
1. Check Clerk status: https://status.clerk.com
2. Verify Clerk keys are correct
3. Check webhook processing
4. If Clerk is down → Enable maintenance mode

### 🟡 MEDIUM: Performance Issues

**Symptoms:**
- Response times > 2s
- High CPU/memory usage
- Slow page loads

**Actions:**
1. Check database connection pool
2. Check for N+1 queries
3. Monitor for 30 minutes
4. Scale if needed (Render Dashboard)

### 🟢 LOW: Minor Issues

**Symptoms:**
- Single user reports issue
- Non-critical console errors
- Warnings in logs

**Actions:**
1. Log the issue
2. Monitor for recurrence
3. Fix in next deployment

---

## Health Check Commands

### Quick Status

```bash
# One-liner status check
curl -s https://muslimeen-api.onrender.com/api/health/auth | jq -r '.status'
```

### Full Health Check

```bash
#!/bin/bash
# health-check.sh

URLS=(
  "https://muslimeen.org|Frontend"
  "https://muslimeen-api.onrender.com/api/health|Backend Health"
  "https://muslimeen-api.onrender.com/api/health/auth|Auth Health"
)

for item in "${URLS[@]}"; do
  IFS='|' read -r url name <<< "$item"
  status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
  if [ "$status" == "200" ]; then
    echo "✅ $name: OK"
  else
    echo "❌ $name: HTTP $status"
  fi
done
```

---

## Monitoring Checklist

### First 5 Minutes

- [ ] Health endpoints return 200
- [ ] No console errors on homepage
- [ ] Clerk UI loads on /login
- [ ] Sentry shows no new errors
- [ ] Render dashboard shows green

### First 15 Minutes

- [ ] Error rate < 1%
- [ ] Response times < 1000ms
- [ ] No auth failures reported
- [ ] CPU usage < 70%
- [ ] Memory usage < 80%

### First 30 Minutes

- [ ] All automated checks passed
- [ ] No critical alerts
- [ ] User traffic handling normally
- [ ] Performance stable
- [ ] Ready for normal monitoring

---

## Common Issues & Fixes

### Issue: 500 Errors

**Diagnose:**
```bash
# Check logs
render logs --service muslimeen-api --follow

# Check Sentry for stack traces
```

**Fix:**
- Database connection issue → Check DATABASE_URL
- Missing env var → Add to Render Dashboard
- Code error → Rollback or hotfix

### Issue: Auth Not Working

**Diagnose:**
```bash
# Test Clerk connection
curl https://muslimeen-api.onrender.com/api/health/auth
```

**Fix:**
- Clerk keys mismatch → Update env vars
- Domain not allowed → Add to Clerk Dashboard
- Webhook failed → Check webhook secret

### Issue: Slow Performance

**Diagnose:**
```bash
# Check response times
curl -w "@curl-format.txt" https://muslimeen-api.onrender.com/api/health/auth
```

**Fix:**
- High CPU → Scale up (Render Dashboard)
- Slow queries → Check database indexes
- Memory leak → Restart service

---

## Rollback Decision Matrix

| Issue Severity | User Impact | Rollback? |
|---------------|-------------|-----------|
| Site down | All users | ✅ YES - Immediate |
| Auth broken | All users | ✅ YES - Immediate |
| Slow > 5s | All users | ⚠️ Consider if > 10 min |
| Feature broken | Some users | ❌ No - Fix forward |
| Console errors | None | ❌ No - Next deploy |

---

## Communication Plan

### If Issues Detected

**Internal (Slack/Teams):**
```
🚨 DEPLOYMENT ISSUE DETECTED
Service: MuslimEEN Production
Issue: [Brief description]
Time: [Timestamp]
Action: [Rollback/Investigating]
Owner: @on-call-engineer
```

**External (If needed):**
- Status page update
- Twitter/Discord notification
- Email to users (if extended outage)

---

## Post-30-Minutes

### Success Criteria

- ✅ No critical errors
- ✅ Error rate < 0.1%
- ✅ Response time < 500ms (p95)
- ✅ Auth success rate > 99%
- ✅ CPU < 50%, Memory < 70%

### Next Steps

1. **Normal Monitoring** - Resume standard monitoring
2. **Incident Review** - Document any issues
3. **Performance Baseline** - Record metrics
4. **Team Notification** - All clear signal

---

## Emergency Contacts

| Role | Contact | Escalation |
|------|---------|------------|
| On-call Engineer | [Add phone] | 5 min |
| Tech Lead | [Add phone] | 15 min |
| Product Manager | [Add phone] | 30 min |
| Render Support | support@render.com | - |
| Vercel Support | support@vercel.com | - |
| Clerk Support | support@clerk.com | - |

---

## Monitoring Commands Reference

```bash
# Start real-time monitoring
npx ts-node scripts/monitor-deployment.ts production

# Analyze logs
./scripts/analyze-logs.sh backend production

# Health check
./scripts/health-check.sh

# View Render logs
render logs --service muslimeen-api --follow

# View Vercel logs
vercel logs --follow
```

---

**⚠️ REMEMBER**: The first 30 minutes are critical. Stay alert and be ready to rollback if needed.

*End of Post-Deployment Monitoring Guide*
