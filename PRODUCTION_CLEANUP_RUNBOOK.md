# Production Cleanup Runbook

**Staff-Level Backend + DevOps Engineer Guide**  
**STATUS**: Ready for Execution  
**RISK LEVEL**: High (destructive operation)  
**DATE**: 2026-03-20

---

## 🎯 Objective

Safely execute production cleanup of legacy authentication system after successful Clerk migration.

---

## ⚠️ Prerequisites (ALL MUST BE CHECKED)

- [ ] **Migration Complete**: 100% of users have `clerk_id` populated
- [ ] **Detection Period**: 14 days of monitoring with ZERO legacy auth
- [ ] **Feature Flags**: `DISABLE_LEGACY_AUTH=true` for 7+ days
- [ ] **Database Backup**: Full backup created and verified
- [ ] **Team Approval**: Written approval from Tech Lead + Product
- [ ] **Maintenance Window**: Scheduled (recommend 2-hour window)
- [ ] **Rollback Tested**: Verified rollback procedure works
- [ ] **Monitoring**: Sentry + logs dashboard accessible

---

## 📊 Pre-Cleanup Verification

### 1. Check Legacy Auth Detections

```bash
# Check last 14 days of detections
curl https://api.muslimeen.org/api/admin/legacy-auth-stats \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Expected: jwtAttempts: 0, csrfAttempts: 0, legacyCookieAttempts: 0
```

### 2. Verify Auth Health

```bash
# Check system readiness
curl https://api.muslimeen.org/api/health/auth/ready

# Expected: { "ready": true, "message": "Safe to proceed" }
```

### 3. Database Verification

```sql
-- Verify all users migrated
SELECT 
  COUNT(*) FILTER (WHERE clerk_id IS NULL) as unmigrated_users,
  COUNT(*) as total_users
FROM users;

-- Expected: unmigrated_users = 0
```

---

## 🚀 Execution Phases

### Phase 1: Detection (Days 1-14)

**Status**: Automated - Already Running

The `legacyAuthDetection` middleware is already logging usage:
- Monitors all requests for JWT/CSRF/Legacy cookies
- Sends events to Sentry
- Exposes stats at `/api/admin/legacy-auth-stats`

**Verification**:
```bash
# Check detection is working
grep "LEGACY.*DETECTED" /var/log/muslimeen/app.log | tail -20
```

### Phase 2: Safe Disable (Days 8-14)

**Status**: Feature Flag Controlled

Enable blocking after 7 days of zero detections:

```bash
# .env
DISABLE_LEGACY_AUTH=true
ENABLE_LEGACY_AUTH_DETECTION=true
```

**Verification**:
```bash
# Restart and verify blocking works
curl -H "Authorization: Bearer $OLD_JWT" https://api.muslimeen.org/api/users/me

# Expected: 401 with "LEGACY_AUTH_DISABLED"
```

### Phase 3: Backup (Day 15 - Cleanup Day)

**Manual Steps**:

```bash
# 1. Create database backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# 2. Verify backup
psql -f backup_$(date +%Y%m%d).sql -c "SELECT 1;"

# 3. Create git tag
git tag -a pre-auth-cleanup-$(date +%Y%m%d) -m "Pre-cleanup backup"
git push origin pre-auth-cleanup-$(date +%Y%m%d)

# 4. Document backup locations
echo "Database: s3://backups/muslimeen/backup_$(date +%Y%m%d).sql"
echo "Code: $(git rev-parse HEAD)"
```

### Phase 4: Database Soft Deprecation (Day 15)

**Execute**:

```sql
-- 1. Drop refresh_tokens
DROP TABLE IF EXISTS refresh_tokens;

-- 2. Rename password_hash (soft delete)
ALTER TABLE users RENAME COLUMN password_hash TO _deprecated_password_hash;
ALTER TABLE users ALTER COLUMN _deprecated_password_hash DROP NOT NULL;
COMMENT ON COLUMN users._deprecated_password_hash IS 
    'DEPRECATED: Remove after 2026-06-20';

-- 3. Drop indexes
DROP INDEX IF EXISTS idx_refresh_tokens_user_id;
DROP INDEX IF EXISTS idx_refresh_tokens_token;
```

### Phase 5: Code Cleanup (Day 15)

**Execute Script**:

```bash
# Run with full confirmation
cd /opt/muslimeen
./scripts/production-cleanup.sh

# Type when prompted: DELETE_AUTH
# Then: yes
```

**What Gets Deleted**:
- Frontend: auth-context.tsx, auth-*-guide.tsx
- Backend: AuthService, JwtService, PasswordService
- Backend: AuthController, auth.ts middleware, unifiedAuth.ts

### Phase 6: Verification (Day 15)

**Automated Checks**:

```bash
# 1. Type check
npm run type-check

# 2. Build
npm run build

# 3. Verify no legacy imports
npm run verify:cleanup

# 4. Run tests
npm test
```

**Manual Checks**:

```bash
# 1. Login test
curl -X POST https://api.muslimeen.org/api/auth/login \
  -d '{"email":"test@example.com","password":"test"}'
# Expected: 501 LEGACY_AUTH_DISABLED

# 2. Clerk login works
# Use frontend to login via Clerk

# 3. Protected API works
curl -H "Authorization: Bearer $CLERK_JWT" \
  https://api.muslimeen.org/api/users/me
# Expected: 200 with user data
```

### Phase 7: Deployment (Day 15)

```bash
# 1. Deploy to staging
./deploy.sh staging

# 2. Smoke tests
./smoke-tests.sh

# 3. Deploy to production (blue/green)
./deploy.sh production --strategy=blue-green

# 4. Monitor
# Watch Sentry, logs, metrics for 2 hours
```

### Phase 8: Monitoring (Days 15-22)

**Daily Checks**:
```bash
# Check for errors
grep -i "error\|fail" /var/log/muslimeen/app.log | grep -i "auth" | wc -l
# Expected: 0

# Check auth endpoint health
curl -s https://api.muslimeen.org/api/health/auth | jq '.legacy.detections_24h'
# Expected: all zeros
```

### Phase 9: Final Cleanup (Days 45-75)

**After 60 days of stability**:

```sql
-- Hard delete deprecated column
ALTER TABLE users DROP COLUMN _deprecated_password_hash;

-- Remove detection middleware from code
-- Disable ENABLE_LEGACY_AUTH_DETECTION
```

---

## 🔁 Rollback Procedures

### Scenario 1: Immediate Rollback (within 1 hour)

```bash
# 1. Revert code
git revert HEAD

# 2. Restore database (if needed)
psql $DATABASE_URL < backup_$(date +%Y%m%d).sql

# 3. Redeploy
./deploy.sh production

# 4. Disable DISABLE_LEGACY_AUTH
# Edit .env, restart
```

### Scenario 2: Database Rollback (column rename)

```sql
-- Reverse soft deprecation
ALTER TABLE users RENAME COLUMN _deprecated_password_hash TO password_hash;

-- Recreate table if needed
CREATE TABLE refresh_tokens (...);
```

### Scenario 3: Partial Rollback (specific user)

```sql
-- If specific user needs old auth
UPDATE users SET clerk_id = NULL WHERE email = 'user@example.com';
```

---

## 📈 Success Metrics

| Metric | Before | After | Target |
|--------|--------|-------|--------|
| Codebase lines | ~15,000 | ~13,000 | -2,000 |
| Dependencies | 35 | 31 | -4 |
| Auth-related errors | baseline | 0 | stable |
| Login success rate | 99.9% | 99.9% | no degradation |
| API response time | 50ms | 45ms | improved |

---

## 🚨 Emergency Contacts

| Role | Contact | Escalation |
|------|---------|------------|
| On-call Engineer | +1-xxx-xxx-xxxx | 15 min |
| Tech Lead | +1-xxx-xxx-xxxx | 30 min |
| Product Manager | +1-xxx-xxx-xxxx | 1 hour |
| Clerk Support | support@clerk.com | async |

---

## 📝 Sign-off Sheet

Execute ONLY after all signatures:

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Tech Lead | _________ | _____________ | _______ |
| DevOps Lead | _________ | _____________ | _______ |
| Product Manager | _________ | _____________ | _______ |
| QA Lead | _________ | _____________ | _______ |

---

## 🔗 Related Documentation

- [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) - Migration process
- [CLEANUP_PLAN.md](CLEANUP_PLAN.md) - Detailed cleanup guide
- [AUTH_TROUBLESHOOTING.md](AUTH_TROUBLESHOOTING.md) - Issue resolution
- [CLERK_WEBHOOKS.md](CLERK_WEBHOOKS.md) - Webhook documentation

---

## 🎓 Lessons Learned

**Document after completion**:
- What went well?
- What could be improved?
- Any unexpected issues?
- Recommendations for future migrations

---

**END OF RUNBOOK**

*Execute with confidence, verify with paranoia, rollback with precision.*
