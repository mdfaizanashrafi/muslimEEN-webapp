# Production Validation Guide

**PROJECT**: MuslimEEN Full Stack  
**DATE**: 2026-03-20  
**PHASE**: Post-Deployment Validation

---

## Overview

This guide validates all critical production flows to ensure the system is fully operational before declaring deployment success.

**⚠️ IMPORTANT**: Run these tests immediately after deployment. Stop and rollback if any critical test fails.

---

## Automated Validation

### Run Automated Test Suite

```bash
# Validate staging
npx ts-node scripts/production-validation.ts staging

# Validate production
npx ts-node scripts/production-validation.ts production
```

**What it tests:**
- ✅ Authentication flows
- ✅ Invite system
- ✅ API security
- ✅ Internal APIs
- ✅ Webhook processing
- ✅ System health

---

## Manual Validation Checklist

### 1. Authentication Flows

#### Test: Login via Clerk

**Steps:**
1. Visit https://muslimeen.org/login
2. Verify Clerk sign-in UI loads
3. Check no console errors
4. Test sign-in with test account
5. Verify redirect to dashboard

**Expected:**
- ✅ Clerk UI visible
- ✅ Console clean (no errors)
- ✅ Login successful
- ✅ Redirect to /dashboard

**If fails:**
- Check Clerk keys configured
- Check domain allowed in Clerk Dashboard
- Check for JavaScript errors

#### Test: Logout

**Steps:**
1. Login to application
2. Click logout/sign out
3. Verify redirect to login
4. Try accessing protected page

**Expected:**
- ✅ Session cleared
- ✅ Redirect to /login
- ✅ Protected pages require re-auth

#### Test: Session Persistence

**Steps:**
1. Login to application
2. Close browser tab
3. Reopen https://muslimeen.org
4. Check if still logged in

**Expected:**
- ✅ Session persists (if "Remember me" enabled)
- ✅ Or requires re-login (expected behavior)

---

### 2. Invite System

#### Test: Valid Invite → Signup Works

**Steps:**
1. Create invite (admin panel or API)
2. Visit /register?invite=VALID_CODE
3. Complete signup form
4. Submit registration

**Expected:**
- ✅ Registration form accepts valid invite
- ✅ Account created successfully
- ✅ User logged in automatically
- ✅ User record synced to database

#### Test: Invalid Invite → Blocked

**Steps:**
1. Visit /register?invite=INVALID_CODE
2. Try to submit form

**Expected:**
- ✅ Error message displayed
- ✅ Registration blocked
- ✅ No account created

#### Test: Missing Invite → Blocked

**Steps:**
1. Visit /register (without invite param)
2. Try to access page

**Expected:**
- ✅ Redirected or error shown
- ✅ Invite required message

---

### 3. API Security

#### Test: Protected Routes Require Auth

**Test via curl:**
```bash
# Should return 401
curl -s https://muslimeen-api.onrender.com/api/users/me
curl -s https://muslimeen-api.onrender.com/api/protected-endpoint
```

**Expected:**
- ✅ HTTP 401 Unauthorized
- ✅ No data exposed

#### Test: Unauthorized Access Blocked

**Test via browser:**
1. Clear cookies/local storage
2. Try to access /dashboard
3. Try to access /api/users/me directly

**Expected:**
- ✅ Redirected to login
- ✅ API returns 401

#### Test: Public Endpoints Accessible

```bash
# Should return 200
curl -s https://muslimeen-api.onrender.com/health
curl -s https://muslimeen-api.onrender.com/api/health/auth
```

**Expected:**
- ✅ HTTP 200 OK
- ✅ Health status returned

---

### 4. Internal APIs

#### Test: API Key Authentication

**With valid key:**
```bash
curl -s https://muslimeen-api.onrender.com/api/internal/health \
  -H "x-api-key: YOUR_VALID_KEY"
```

**Expected:**
- ✅ HTTP 200 OK
- ✅ Data returned

**Without key:**
```bash
curl -s https://muslimeen-api.onrender.com/api/internal/health
```

**Expected:**
- ✅ HTTP 401 Unauthorized

**With invalid key:**
```bash
curl -s https://muslimeen-api.onrender.com/api/internal/health \
  -H "x-api-key: invalid-key"
```

**Expected:**
- ✅ HTTP 401 Unauthorized

---

### 5. Webhooks

#### Test: Webhook Endpoint Responds

```bash
# Test endpoint exists (should reject unsigned)
curl -s -X POST https://muslimeen-api.onrender.com/api/webhooks/clerk \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

**Expected:**
- ✅ Not 404 (endpoint exists)
- ✅ Returns 401 (requires signature)

#### Test: Webhook Metrics Tracked

```bash
curl -s https://muslimeen-api.onrender.com/api/health/auth | jq '.checks.webhooks'
```

**Expected:**
- ✅ Webhook metrics present
- ✅ Success/failure counts shown

#### Test: User Created via Webhook

**Steps:**
1. Create user via Clerk Dashboard (test user)
2. Wait 5-10 seconds
3. Check database for user record

**Query:**
```sql
SELECT * FROM users WHERE email = 'test@example.com';
```

**Expected:**
- ✅ User record exists
- ✅ clerk_id populated
- ✅ Role set correctly

---

## System Health Validation

### Backend Health

```bash
# Full health check
curl -s https://muslimeen-api.onrender.com/api/health/auth | jq
```

**Verify:**
- ✅ `success: true`
- ✅ `status: "healthy"`
- ✅ `auth.system: "clerk"`
- ✅ `checks.database.status: "healthy"`
- ✅ `checks.clerk_api.status: "healthy"`
- ✅ `checks.webhooks.health: "healthy"`

### Frontend Health

```bash
# Homepage loads
curl -s -o /dev/null -w "%{http_code}" https://muslimeen.org
# Expected: 200
```

### Performance Check

```bash
# Response time < 500ms
curl -w "@curl-format.txt" -s https://muslimeen-api.onrender.com/health
```

**curl-format.txt:**
```
time_namelookup: %{time_namelookup}\n
time_connect: %{time_connect}\n
time_appconnect: %{time_appconnect}\n
time_pretransfer: %{time_pretransfer}\n
time_redirect: %{time_redirect}\n
time_starttransfer: %{time_starttransfer}\n\ntime_total: %{time_total}\n
```

---

## Critical Success Criteria

| Test | Critical | Status |
|------|----------|--------|
| Login via Clerk | ✅ Yes | ⬜ |
| Logout works | ✅ Yes | ⬜ |
| Session persists | ❌ No | ⬜ |
| Valid invite works | ✅ Yes | ⬜ |
| Invalid invite blocked | ✅ Yes | ⬜ |
| Protected routes require auth | ✅ Yes | ⬜ |
| Unauthorized access blocked | ✅ Yes | ⬜ |
| API key auth works | ✅ Yes | ⬜ |
| Webhook endpoint responds | ✅ Yes | ⬜ |
| Health checks pass | ✅ Yes | ⬜ |

---

## If Tests Fail

### Immediate Actions

1. **Stop traffic** (if possible)
   ```bash
   # Enable maintenance mode
   SYSTEM_READ_ONLY=true
   ```

2. **Document the failure**
   - Screenshot error
   - Copy error message
   - Note timestamp

3. **Rollback decision**
   - Can it be fixed in < 5 minutes?
   - Is it affecting all users?
   - **If YES → Rollback immediately**

4. **Execute rollback**
   ```bash
   # Backend
   # Render Dashboard > muslimeen-api > Previous Build > Deploy
   
   # Frontend
   # Vercel Dashboard > Project > Previous Deployment > Promote
   ```

### Common Issues

| Issue | Quick Fix |
|-------|-----------|
| Clerk not loading | Check keys, domain whitelist |
| API 500 errors | Check database connection |
| Auth failing | Verify Clerk webhook secret |
| Invite not working | Check invite service logs |
| Slow responses | Check Render resource usage |

---

## Sign-Off Sheet

**Validation completed by:**

| Test Category | Tester | Date | Status |
|---------------|--------|------|--------|
| Authentication | _________ | _______ | ⬜ Pass ⬜ Fail |
| Invite System | _________ | _______ | ⬜ Pass ⬜ Fail |
| API Security | _________ | _______ | ⬜ Pass ⬜ Fail |
| Internal APIs | _________ | _______ | ⬜ Pass ⬜ Fail |
| Webhooks | _________ | _______ | ⬜ Pass ⬜ Fail |
| System Health | _________ | _______ | ⬜ Pass ⬜ Fail |

**Overall Status:** ⬜ APPROVED FOR PRODUCTION ⬜ ROLLBACK REQUIRED

**Tech Lead Sign-off:** _________________ Date: _______

---

## Quick Reference

### Commands

```bash
# Automated validation
npx ts-node scripts/production-validation.ts production

# Health check
curl https://muslimeen-api.onrender.com/api/health/auth | jq

# API test
curl -s https://muslimeen-api.onrender.com/api/users/me
# Expected: 401

# Internal API test
curl -s -H "x-api-key: KEY" https://muslimeen-api.onrender.com/api/internal/health
```

### URLs

| Service | URL |
|---------|-----|
| Frontend | https://muslimeen.org |
| Backend | https://muslimeen-api.onrender.com |
| Health | https://muslimeen-api.onrender.com/api/health/auth |
| Clerk Dashboard | https://dashboard.clerk.com |
| Render Dashboard | https://dashboard.render.com |
| Vercel Dashboard | https://vercel.com/dashboard |

---

**✅ ALL TESTS MUST PASS BEFORE DECLARING DEPLOYMENT SUCCESS**

*End of Production Validation Guide*
