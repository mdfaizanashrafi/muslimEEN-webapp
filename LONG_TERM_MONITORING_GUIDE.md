# Long-Term Stability Monitoring Guide

**PROJECT**: MuslimEEN Production System  
**MONITORING PERIOD**: 24-48 Hours Post-Deployment  
**DATE**: 2026-03-20

---

## Overview

This guide covers monitoring system stability for 24-48 hours after production deployment to ensure long-term reliability and detect any delayed issues.

**⚠️ IMPORTANT**: The first 24-48 hours are critical for catching:
- Slow memory leaks
- Database connection pool exhaustion
- Rate limiting issues
- Background job failures
- Intermittent errors

---

## Monitoring Strategy

### Phase 1: Intensive (Hours 0-6)

**Frequency**: Every 5 minutes  
**Focus**: Immediate issues, error spikes

```bash
# Start real-time monitoring
npx ts-node scripts/monitor-deployment.ts production

# Run continuously for 6 hours
# Keep terminal open or run in screen/tmux
```

### Phase 2: Regular (Hours 6-24)

**Frequency**: Every 15 minutes  
**Focus**: Trend analysis, performance

```bash
# Hourly health checks
./scripts/health-check.sh production

# Check logs every hour
./scripts/analyze-logs.sh backend production
```

### Phase 3: Extended (Hours 24-48)

**Frequency**: Every 30 minutes  
**Focus**: Long-term stability, resource usage

```bash
# Start long-term monitor (samples every 5 min, reports hourly)
npx ts-node scripts/long-term-monitor.ts production 48
```

---

## Key Metrics to Track

### 1. Error Rates

**Target**: < 0.1%  
**Warning**: > 0.5%  
**Critical**: > 1%

**How to check:**
```bash
# Via Sentry
curl -s https://sentry.io/api/0/projects/your-org/muslimeen/stats/ | jq

# Via logs
grep -c "error" backend/logs/app.log
```

### 2. Authentication Success Rate

**Target**: > 99.5%  
**Warning**: < 99%  
**Critical**: < 95%

**How to check:**
```bash
# Check Clerk dashboard
# https://dashboard.clerk.com/insights

# Check auth health
curl -s https://muslimeen-api.onrender.com/api/health/auth | jq '.checks.auth'
```

### 3. Webhook Reliability

**Target**: > 99% success  
**Warning**: < 95%  
**Critical**: < 90%

**How to check:**
```bash
# Check webhook metrics
curl -s https://muslimeen-api.onrender.com/api/health/auth | jq '.checks.webhooks'
```

### 4. Response Time (p95)

**Target**: < 500ms  
**Warning**: > 1000ms  
**Critical**: > 2000ms

**How to check:**
```bash
# Check Render dashboard
# Or use curl with timing
curl -w "@curl-format.txt" -s https://muslimeen-api.onrender.com/health
```

### 5. Availability

**Target**: 99.9% (43 min downtime/month)  
**Warning**: < 99.5%  
**Critical**: < 99%

**How to check:**
```bash
# Via Render dashboard
# Or automated monitoring
```

---

## Daily Monitoring Checklist

### Every Hour (First 24 Hours)

- [ ] Health endpoints return 200
- [ ] Error rate < 0.1% (check Sentry)
- [ ] Auth success rate > 99%
- [ ] Response time < 500ms (p95)
- [ ] CPU usage < 50%
- [ ] Memory usage < 70%
- [ ] Database connections stable
- [ ] No critical alerts in Sentry

### Every 6 Hours

- [ ] Review error logs for patterns
- [ ] Check webhook processing stats
- [ ] Verify invite system working
- [ ] Test login/logout manually
- [ ] Check user feedback/channels

### Daily (24-48 Hour Period)

- [ ] Generate stability report
- [ ] Review trends (improving/stable/degrading)
- [ ] Compare metrics to baseline
- [ ] Check for slow resource leaks
- [ ] Verify backup jobs ran

---

## Monitoring Commands

### Quick Status

```bash
# Full health check
./scripts/health-check.sh production

# Backend only
curl -s https://muslimeen-api.onrender.com/api/health/auth | jq

# Frontend only
curl -s https://muslimeen.org/status | jq
```

### Error Analysis

```bash
# Recent errors
./scripts/analyze-logs.sh backend production

# Sentry errors (last hour)
# Visit: https://sentry.io/organizations/your-org/issues/

# Clerk errors
curl -s https://muslimeen-api.onrender.com/api/health/auth | jq '.errors'
```

### Performance

```bash
# Response time check
curl -w "@curl-format.txt" -o /dev/null -s https://muslimeen-api.onrender.com/health

# Render metrics
# Dashboard: https://dashboard.render.com/web/services/muslimeen-api
```

### Long-Term Monitor

```bash
# Start 48-hour monitor
npx ts-node scripts/long-term-monitor.ts production 48

# Saves reports to logs/ directory
# Generates hourly reports
# Tracks trends automatically
```

---

## Alert Response

### 🔴 Critical Issues (Immediate Response)

**Symptoms:**
- Error rate > 1%
- Site down > 2 minutes
- Auth failure rate > 5%
- Database connection failures

**Response:**
1. Enable read-only mode (if applicable)
2. Page on-call engineer
3. Consider rollback if can't fix in 10 minutes
4. Post incident status

### 🟠 Warning Issues (30 min response)

**Symptoms:**
- Error rate 0.5-1%
- Response time > 1000ms sustained
- Memory usage climbing
- Intermittent failures

**Response:**
1. Monitor closely
2. Check resource usage
3. Scale if needed
4. Schedule fix if not urgent

### 🟡 Watch Items (Next day)

**Symptoms:**
- Minor error patterns
- Slight performance degradation
- Non-critical warnings

**Response:**
1. Log for review
2. Add to backlog
3. Fix in next deployment

---

## Stability Report Template

### Daily Report (Auto-generated)

```markdown
## Stability Report - Day X

**Date**: 2026-03-20  
**Environment**: Production  
**Runtime**: 24 hours

### Metrics Summary

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Availability | 99.95% | 99.9% | ✅ |
| Error Rate | 0.02% | < 0.1% | ✅ |
| Auth Success | 99.7% | > 99% | ✅ |
| Avg Response | 320ms | < 500ms | ✅ |
| Webhook Success | 99.8% | > 99% | ✅ |

### Trends

- Error Rate: Stable
- Response Time: Improving
- Memory Usage: Stable

### Issues

- None critical

### Recommendations

- Continue monitoring
- System is stable
```

---

## Success Criteria (24-48 Hours)

### Must Achieve

- [ ] Zero critical errors
- [ ] Availability > 99.9%
- [ ] Error rate < 0.1%
- [ ] Auth success rate > 99%
- [ ] No memory leaks detected
- [ ] No resource exhaustion
- [ ] Webhook processing stable

### Nice to Have

- [ ] Error rate < 0.05%
- [ ] Response time < 300ms (p95)
- [ ] Zero warnings
- [ ] Performance improving trend

---

## Red Flags

### Stop and Investigate

🚨 **Immediately if:**
- Error rate consistently > 0.5%
- Memory usage growing over time
- Database connection pool exhausted
- Webhook failure rate > 5%
- Multiple user complaints
- Performance degrading trend

### Escalate

📞 **Contact on-call if:**
- Can't resolve issue in 30 minutes
- User-facing functionality broken
- Data integrity concerns
- Security issues detected

---

## Final Sign-Off (48 Hours)

### Stability Verification

| Check | Criteria | Status |
|-------|----------|--------|
| Availability | > 99.9% | ⬜ |
| Error Rate | < 0.1% | ⬜ |
| Auth Success | > 99% | ⬜ |
| Response Time | < 500ms | ⬜ |
| Memory Stable | No growth | ⬜ |
| No Critical Issues | 48h clean | ⬜ |

### Team Sign-Off

**Verified by:**

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Tech Lead | _________ | _______ | _____________ |
| DevOps | _________ | _______ | _____________ |
| On-call | _________ | _______ | _____________ |

**Final Status:** ⬜ SYSTEM STABLE ⬜ ISSUES DETECTED

---

## Post-Stabilization

### If System is Stable (48h)

1. ✅ Resume normal monitoring
2. ✅ Document baseline metrics
3. ✅ Update runbooks
4. ✅ Team celebration!

### If Issues Detected

1. 🔧 Create incident report
2. 🔧 Fix critical issues
3. 🔧 Extend monitoring
4. 🔧 Schedule post-mortem

---

**🎯 GOAL: 48 hours of stable production operation**

*End of Long-Term Monitoring Guide*
