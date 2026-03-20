# Legacy Auth Code Cleanup Plan

**STATUS**: ⏳ Pre-execution Phase  
**EXECUTE ONLY AFTER**: 100% migration confirmed + 30 days stable  
**DATE**: 2026-03-20

---

## ⚠️ CRITICAL WARNINGS

1. **DO NOT EXECUTE** until all users are migrated to Clerk
2. **BACKUP DATABASE** before running any cleanup
3. **TEST IN STAGING** first - full dry run
4. **MAINTAIN ROLLBACK** capability for 7 days after cleanup
5. **COORDINATE DEPLOYMENT** with team - schedule maintenance window

---

## Phase 1: Pre-Cleanup Verification

### Checklist Before Starting

- [ ] All users have `clerk_id` populated
- [ ] Zero legacy JWT tokens in use (check logs)
- [ ] Clerk webhooks functioning for 30+ days
- [ ] Feature flags: `USE_CLERK_AUTH=true`, `DUAL_AUTH_MODE=false`
- [ ] Database backup created
- [ ] Rollback plan tested
- [ ] Team notified of maintenance window

### Verification Commands

```bash
# 1. Verify all users migrated
psql muslimeen -c "SELECT COUNT(*) FROM users WHERE clerk_id IS NULL;"
# Expected: 0

# 2. Check for JWT auth in logs (last 7 days)
grep "JWT auth" /var/log/muslimeen/*.log | wc -l
# Expected: 0

# 3. Verify feature flags
grep -E "USE_CLERK_AUTH|DUAL_AUTH" backend/.env
# Expected: USE_CLERK_AUTH=true, DUAL_AUTH_MODE=false

# 4. Test critical auth flows
npm run test:auth:e2e
# Expected: All tests pass
```

---

## Phase 2: Frontend Cleanup

### Files to Delete

| File | Reason | Size |
|------|--------|------|
| `frontend/lib/auth-context.tsx` | Replaced by Clerk hooks | ~7KB |
| `frontend/lib/auth-final-guide.tsx` | Documentation file | ~10KB |
| `frontend/lib/auth-usage-guide.tsx` | Documentation file | ~11KB |

### Files to Modify

| File | Changes | Lines Removed |
|------|---------|---------------|
| `frontend/lib/api.ts` | Remove CSRF functions, keep no-op exports for compat | ~50 |
| `frontend/components/NetworkStatus.tsx` | Remove CSRF references | ~10 |
| `frontend/lib/error-messages.ts` | Remove CSRF error messages | ~5 |

### API.ts Cleanup

**Current**:
```typescript
// CSRF functions - NO-OPS for backward compatibility (Clerk handles auth)
export const setCsrfToken = (token: string): void => {};
export const clearCsrfToken = (): void => {};
export const ensureCsrfToken = async (): Promise<string | null> => null;
export const getCsrfToken = (): string | null => null;
```

**After Cleanup**:
```typescript
// CSRF no longer needed - Clerk handles auth
// These exports are deprecated and will be removed in v2.0
export const setCsrfToken = (): void => {};
export const clearCsrfToken = (): void => {};
export const ensureCsrfToken = async (): Promise<null> => null;
export const getCsrfToken = (): null => null;
```

---

## Phase 3: Backend Cleanup

### Services to Delete

| Service | File | Dependencies to Check |
|---------|------|----------------------|
| AuthService | `backend/src/modules/iam/services/AuthService.ts` | AuthController, auth routes |
| JwtService | `backend/src/modules/iam/services/JwtService.ts` | AuthService, auth middleware |
| PasswordService | `backend/src/modules/iam/services/PasswordService.ts` | AuthService, UserService |

**Keep**: `AccountLockoutService.ts` - May still be useful for Clerk rate limiting

### Controllers to Delete

| Controller | File | Note |
|------------|------|------|
| AuthController | `backend/src/modules/iam/controllers/AuthController.ts` | All endpoints now handled by Clerk |

**Keep**: `ClerkWebhookController.ts` - Required for user sync

### Middleware to Delete

| Middleware | File | Replacement |
|------------|------|-------------|
| auth.ts (legacy) | `backend/src/modules/iam/middleware/auth.ts` | clerkAuth.ts |
| unifiedAuth.ts | `backend/src/modules/iam/middleware/unifiedAuth.ts` | Not needed after full migration |

**Keep**: `clerkAuth.ts` - Primary auth middleware

### Routes to Modify

| Route | Changes |
|-------|---------|
| `backend/src/modules/auth/routes.ts` | Simplify to only Clerk endpoints |

**Current**:
```typescript
router.post('/login', ...);  // Returns 501
router.post('/register', ...);  // Returns 501
router.post('/refresh', ...);  // Returns 501
```

**After Cleanup**:
```typescript
// Auth routes - Clerk only
router.post('/logout', clerkAuthenticate, AuthController.logout);
router.get('/me', clerkAuthenticate, AuthController.getCurrentUser);
```

---

## Phase 4: Database Cleanup

### Tables to Drop

```sql
-- 1. Drop refresh_tokens table
DROP TABLE IF EXISTS refresh_tokens;

-- 2. Archive password hashes (don't delete immediately, just in case)
ALTER TABLE users RENAME COLUMN password_hash TO _deprecated_password_hash;
ALTER TABLE users ALTER COLUMN _deprecated_password_hash DROP NOT NULL;

-- After 90 days of stability:
-- ALTER TABLE users DROP COLUMN _deprecated_password_hash;
```

### Index Cleanup

```sql
-- Remove indexes related to legacy auth
DROP INDEX IF EXISTS idx_refresh_tokens_user_id;
DROP INDEX IF EXISTS idx_refresh_tokens_token;
DROP INDEX IF EXISTS idx_users_password_hash;  -- If exists
```

---

## Phase 5: Configuration Cleanup

### Environment Variables to Remove

```bash
# JWT Configuration (LEGACY - remove after migration)
# JWT_SECRET=...                    # REMOVE
# JWT_EXPIRES_IN=24h               # REMOVE

# CSRF Protection (Clerk handles this)
# CSRF_SECRET=...                  # REMOVE

# Cookie Signing (Clerk handles session)
# COOKIE_SECRET=...                # REMOVE (unless used elsewhere)

# Password Hashing (Clerk manages passwords)
# BCRYPT_ROUNDS=12                 # REMOVE
```

### Files to Modify

| File | Changes |
|------|---------|
| `backend/.env.example` | Remove legacy env vars |
| `backend/src/config/env.ts` | Remove JWT, CSRF, BCRYPT validation |
| `docker-compose.yml` | Remove legacy secrets |

---

## Phase 6: Dependency Cleanup

### Packages to Remove

```bash
# Backend
npm uninstall jsonwebtoken bcrypt cookie-parser csrf

# Frontend (if any)
# Most auth deps are handled by @clerk/nextjs
```

### Keep These

```bash
# Still needed
@clerk/clerk-sdk-node    # Clerk backend SDK
@clerk/nextjs            # Clerk frontend SDK
helmet                   # Security headers
express-rate-limit       # Rate limiting
```

---

## Execution Order

```
┌─────────────────────────────────────────────────────────────┐
│  PHASE 1: PRE-CLEANUP VERIFICATION                          │
│  ├── Verify 100% migration                                  │
│  ├── Create database backup                                 │
│  ├── Test in staging                                        │
│  └── Schedule maintenance window                            │
├─────────────────────────────────────────────────────────────┤
│  PHASE 2: FRONTEND CLEANUP                                  │
│  ├── Delete auth-context.tsx                                │
│  ├── Delete auth-*-guide.tsx files                          │
│  ├── Clean api.ts (CSRF removal)                            │
│  └── Test build                                             │
├─────────────────────────────────────────────────────────────┤
│  PHASE 3: BACKEND CLEANUP                                   │
│  ├── Delete AuthService.ts                                  │
│  ├── Delete JwtService.ts                                   │
│  ├── Delete PasswordService.ts                              │
│  ├── Delete AuthController.ts                               │
│  ├── Delete auth.ts middleware                              │
│  ├── Delete unifiedAuth.ts middleware                       │
│  ├── Simplify auth routes                                   │
│  └── Update router.ts                                       │
├─────────────────────────────────────────────────────────────┤
│  PHASE 4: DATABASE CLEANUP                                  │
│  ├── Drop refresh_tokens table                              │
│  ├── Rename password_hash column                            │
│  └── Drop legacy indexes                                    │
├─────────────────────────────────────────────────────────────┤
│  PHASE 5: CONFIG CLEANUP                                    │
│  ├── Remove env vars                                        │
│  ├── Update env.ts                                          │
│  └── Update .env.example                                    │
├─────────────────────────────────────────────────────────────┤
│  PHASE 6: DEPENDENCY CLEANUP                                │
│  ├── Uninstall legacy packages                              │
│  ├── Update package.json                                    │
│  └── npm audit                                              │
├─────────────────────────────────────────────────────────────┤
│  PHASE 7: VERIFICATION                                      │
│  ├── Full test suite                                        │
│  ├── Security scan                                          │
│  └── Performance test                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Rollback Plan

### If Issues Detected

```bash
# 1. Revert code changes
git revert HEAD~n  # Revert cleanup commits

# 2. Restore database (if needed)
psql muslimeen < backup_YYYYMMDD.sql

# 3. Re-enable dual auth mode
USE_CLERK_AUTH=false
DUAL_AUTH_MODE=true

# 4. Redeploy
pm2 restart backend
```

### Database Rollback

```sql
-- If password_hash was renamed
ALTER TABLE users RENAME COLUMN _deprecated_password_hash TO password_hash;

-- If refresh_tokens was dropped
-- Restore from backup
```

---

## Post-Cleanup Verification

### Automated Checks

```bash
# 1. No legacy auth references
grep -r "jsonwebtoken\|JWT_SECRET\|PasswordService" backend/src/ || echo "✓ Clean"

# 2. No CSRF references in frontend
grep -r "CSRF\|csrf" frontend/lib/ --include="*.ts" --include="*.tsx" || echo "✓ Clean"

# 3. Build passes
npm run build  # Both frontend and backend

# 4. Tests pass
npm test

# 5. No orphan imports
npx ts-node scripts/check-orphan-imports.ts
```

### Manual Checks

- [ ] Login works with Clerk
- [ ] Logout works
- [ ] Session persists
- [ ] Invite system works
- [ ] Admin routes protected
- [ ] API endpoints accessible
- [ ] No console errors
- [ ] No 500 errors in logs

---

## Timeline

| Phase | Duration | Owner |
|-------|----------|-------|
| Pre-cleanup verification | 1 day | DevOps |
| Frontend cleanup | 2 hours | Frontend |
| Backend cleanup | 4 hours | Backend |
| Database cleanup | 1 hour | DBA |
| Config cleanup | 1 hour | DevOps |
| Dependency cleanup | 1 hour | DevOps |
| Verification | 1 day | QA |
| **Total** | **~3 days** | Team |

---

## Success Criteria

- [ ] Smaller codebase (remove ~2000 lines)
- [ ] No dead code (0 orphan imports)
- [ ] Clean architecture (single auth method)
- [ ] All tests pass
- [ ] Security scan clean
- [ ] Performance improved (no JWT verification overhead)
- [ ] Bundle size reduced

---

## Related Documents

- [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) - Migration process
- [AUTH_TEST_REPORT.md](AUTH_TEST_REPORT.md) - Test results
- [AUTH_TROUBLESHOOTING.md](AUTH_TROUBLESHOOTING.md) - Issue resolution
