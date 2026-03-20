# Auth System Troubleshooting Guide

**QUICK FIXES FOR COMMON ISSUES**

---

## 🔴 Critical Issues

### "Cannot login - Invalid credentials"

**Symptoms**: User can't login, Clerk returns error

**Checks**:
```bash
# 1. Check if user exists in Clerk
curl https://api.clerk.com/v1/users?email_address=user@example.com \
  -H "Authorization: Bearer $CLERK_SECRET_KEY"

# 2. Check if user has clerk_id in DB
psql muslimeen -c "SELECT clerk_id FROM users WHERE email = 'user@example.com';"
```

**Fixes**:
```bash
# If user missing from DB but exists in Clerk
# → Check webhook logs

# If user missing from Clerk but exists in DB
# → Run migration script
npm run migrate:users-to-clerk

# If clerk_id is NULL
# → Manually link or re-migrate
psql muslimeen -c "UPDATE users SET clerk_id = 'user_xxx' WHERE email = 'user@example.com';"
```

---

### "Invite code not working"

**Symptoms**: Valid invite rejected

**Checks**:
```sql
-- Check invite status
SELECT token, status, expires_at, used_by 
FROM invites 
WHERE token = 'ABC123XYZ';
```

**Fixes**:
```sql
-- If expired, create new invite
-- If used by wrong user, check audit logs
-- If revoked, unrevoke (admin only)
UPDATE invites SET status = 'pending' WHERE token = 'ABC123XYZ';
```

---

### "Webhooks not firing"

**Symptoms**: Clerk events not reaching backend

**Checks**:
```bash
# 1. Verify webhook URL in Clerk Dashboard
# Should be: https://api.yoursite.com/api/webhooks/clerk

# 2. Check webhook secret
env | grep CLERK_WEBHOOK_SECRET

# 3. Check if webhooks enabled
grep USE_CLERK_WEBHOOKS backend/.env
```

**Fixes**:
```bash
# Enable webhooks
USE_CLERK_WEBHOOKS=true

# Restart server
pm2 restart backend

# Check logs
tail -f logs/webhooks.log
```

---

## 🟡 Common Issues

### "401 Unauthorized on API calls"

**Causes**:
1. Token expired
2. Invalid token format
3. User not in database

**Diagnosis**:
```bash
# Check token format (should be Clerk JWT)
echo $TOKEN | cut -d'.' -f2 | base64 -d | jq

# Should contain: sub, iat, exp, iss (with 'clerk')
```

**Fixes**:
- **Expired**: User needs to re-login
- **Invalid format**: Check frontend is using Clerk's getToken()
- **User not found**: Check clerk_id mapping

---

### "403 Forbidden on admin routes"

**Checks**:
```sql
-- Check user role
SELECT email, role FROM users WHERE email = 'user@example.com';
```

**Fixes**:
```sql
-- Promote to admin (be careful!)
UPDATE users SET role = 'admin' WHERE email = 'user@example.com';

-- Sync to Clerk metadata (if needed)
```

---

### "Migration script fails"

**Common Errors**:

**"CLERK_SECRET_KEY not configured"**
```bash
export CLERK_SECRET_KEY=sk_test_...
```

**"form_identifier_exists"**
```bash
# User already in Clerk - this is OK, script will link
# Check logs for linking confirmation
```

**"Database connection failed"**
```bash
# Check DATABASE_URL
psql $DATABASE_URL -c "SELECT 1;"
```

---

## 🔵 Feature Flag Issues

### "Clerk auth not working"

**Check flags**:
```bash
grep -E "USE_CLERK|DUAL_AUTH" backend/.env
```

**States**:
```bash
# State 1: Legacy only (safe default)
USE_CLERK_AUTH=false
DUAL_AUTH_MODE=false

# State 2: Dual mode (migration)
USE_CLERK_AUTH=false
DUAL_AUTH_MODE=true
CLERK_ROLLOUT_PERCENTAGE=25

# State 3: Clerk only (full migration)
USE_CLERK_AUTH=true
DUAL_AUTH_MODE=false
```

**Emergency rollback**:
```bash
# Disable Clerk immediately
sed -i 's/USE_CLERK_AUTH=true/USE_CLERK_AUTH=false/' backend/.env
pm2 restart backend
```

---

## 🟢 Validation Commands

### Verify Auth Flow

```bash
# 1. Test invite validation
curl /api/invites/validate/ABC123XYZ

# 2. Test login (Clerk)
# Use frontend login page

# 3. Test protected endpoint
curl -H "Authorization: Bearer $TOKEN" /api/users/me

# 4. Test webhook (requires Clerk signature)
# Use Clerk Dashboard "Test" feature
```

### Check User Migration Status

```sql
-- Overall progress
SELECT 
  COUNT(*) FILTER (WHERE clerk_id IS NOT NULL) as migrated,
  COUNT(*) FILTER (WHERE clerk_id IS NULL) as pending,
  ROUND(100.0 * COUNT(*) FILTER (WHERE clerk_id IS NOT NULL) / COUNT(*), 2) as percent
FROM users;

-- Recently migrated
SELECT email, clerk_id, updated_at 
FROM users 
WHERE clerk_id IS NOT NULL 
ORDER BY updated_at DESC 
LIMIT 10;
```

---

## 🛠️ Debug Mode

### Enable Debug Logging

```bash
# Backend
LOG_LEVEL=debug
DEBUG=clerk,muslimeen:auth

# Frontend (browser console)
localStorage.setItem('clerkDebug', 'true')
```

### Test Webhook Locally

```bash
# 1. Start ngrok
npx ngrok http 3001

# 2. Update webhook URL in Clerk Dashboard
# https://xxxx.ngrok.io/api/webhooks/clerk

# 3. Trigger test event from Clerk Dashboard
```

---

## 📊 Monitoring Queries

### Auth Failures (Last Hour)

```sql
-- Failed logins by type
SELECT 
  error_code,
  COUNT(*),
  MAX(created_at) as last_occurrence
FROM auth_logs 
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY error_code;
```

### Webhook Status

```sql
-- Recent webhook events
SELECT 
  event_type,
  status,
  created_at
FROM webhook_logs 
ORDER BY created_at DESC 
LIMIT 20;
```

### Invite Usage

```sql
-- Invites by status
SELECT 
  status,
  COUNT(*),
  MIN(created_at) as oldest,
  MAX(created_at) as newest
FROM invites 
GROUP BY status;
```

---

## 🆘 Emergency Contacts

| Issue | Contact | Escalation |
|-------|---------|------------|
| Auth down | On-call engineer | CTO |
| Data breach | Security team | CEO + Legal |
| Clerk outage | DevOps | Clerk support |
| User lockout | Support lead | Product |

---

## 📞 Support Runbook

### User Reports "Can't Login"

1. **Check email exists**
   ```sql
   SELECT email, clerk_id, is_active FROM users WHERE email = 'user@example.com';
   ```

2. **If clerk_id is NULL**
   - User hasn't migrated
   - They should use old login OR
   - Run migration for this user

3. **If clerk_id exists**
   - User is migrated
   - Check Clerk dashboard for user status
   - Try password reset

4. **If user not in DB**
   - Check if webhook fired
   - Check if invite was required
   - May need manual account creation

### Admin Needs Emergency Access

```sql
-- Promote user to admin
UPDATE users SET role = 'super_admin' WHERE email = 'admin@example.com';

-- Verify
SELECT email, role FROM users WHERE email = 'admin@example.com';
```

---

## 🔗 Related Docs

- [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) - Full migration guide
- [MIGRATION_QUICKREF.md](MIGRATION_QUICKREF.md) - Quick reference
- [CLERK_WEBHOOKS.md](CLERK_WEBHOOKS.md) - Webhook documentation
- [INVITE_ONLY_SIGNUP.md](INVITE_ONLY_SIGNUP.md) - Signup flow
