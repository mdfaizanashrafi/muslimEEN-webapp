# 🎯 Monitoring Quick Reference Card

**Keep this handy during 24-48 hour monitoring**

---

## 🚀 Start Monitoring

```bash
# Start 48-hour monitor (keeps running)
npx ts-node scripts/long-term-monitor.ts production 48

# Or run in background (Linux/Mac)
nohup npx ts-node scripts/long-term-monitor.ts production 48 > monitor.log 2>&1 &
```

---

## ⚡ Quick Checks

```bash
# Health check (quick)
./scripts/health-check.sh production

# Check auth
curl -s https://muslimeen-api.onrender.com/api/health/auth | jq

# Check errors
curl -s https://muslimeen-api.onrender.com/api/health/auth | jq '.errors'
```

---

## 📊 Key URLs

| Service | URL |
|---------|-----|
| **Frontend** | https://muslimeen.org |
| **Backend API** | https://muslimeen-api.onrender.com |
| **Health** | https://muslimeen-api.onrender.com/api/health/auth |
| **Sentry** | https://sentry.io (check for errors) |
| **Clerk** | https://dashboard.clerk.com (auth metrics) |
| **Render** | https://dashboard.render.com (server metrics) |
| **Vercel** | https://vercel.com/dashboard (frontend metrics) |

---

## 🚦 Thresholds

| Metric | ✅ OK | ⚠️ Warn | 🚨 Critical |
|--------|------|---------|-------------|
| **Availability** | >99.9% | <99.5% | <99% |
| **Error Rate** | <0.1% | >0.5% | >1% |
| **Auth Success** | >99.5% | <99% | <95% |
| **Response Time** | <500ms | >1000ms | >2000ms |

---

## 🔴 Emergency Actions

### If Error Rate > 1%
```bash
# 1. Check Sentry immediately
# 2. Run log analysis
./scripts/analyze-logs.sh backend production

# 3. Consider rollback if can't fix in 10 min
```

### If Site Down
```bash
# 1. Check Render status
# 2. Check logs
./scripts/analyze-logs.sh backend production

# 3. Page on-call
```

### Enable Read-Only Mode (if needed)
```bash
# Set in Render dashboard:
SYSTEM_READ_ONLY=true
```

---

## 📋 Hourly Checklist

- [ ] Health endpoints: 200 OK
- [ ] Error rate: < 0.1%
- [ ] Auth: > 99% success
- [ ] Response time: < 500ms
- [ ] No critical Sentry alerts

---

## 📈 Generate Report

```bash
# After 48 hours, generate final report
npx ts-node scripts/generate-stability-report.ts production

# Output: STABILITY-REPORT-PRODUCTION-YYYY-MM-DD.md
```

---

## 📞 Escalation

| Issue | Action |
|-------|--------|
| Critical alert | Page on-call immediately |
| Can't resolve in 30 min | Escalate to tech lead |
| Multiple user complaints | Post incident status |
| Data concerns | Stop writes, investigate |

---

## 💡 Tips

- Keep terminal with monitor visible
- Check Sentry at least every 6 hours
- Run manual auth test once per day
- Document any anomalies

---

**Monitor running?** ⬜ Yes ⬜ Not yet

**Started at:** ___________

**Expected end:** ___________

---

*Print this card and keep it handy!*
