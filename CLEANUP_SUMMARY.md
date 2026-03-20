# Legacy Auth Cleanup - Summary

**STATUS**: ⏳ Ready for Execution (After Migration)  
**ESTIMATED REDUCTION**: ~2000 lines of code, 4 dependencies  
**EXECUTE AFTER**: 30 days of stable Clerk operation

---

## Quick Start

```bash
# 1. Verify cleanup is safe to run
npm run verify:cleanup

# 2. Dry run (no changes)
./scripts/cleanup-legacy-auth.sh dry-run

# 3. Execute cleanup
./scripts/cleanup-legacy-auth.sh execute
```

---

## What Will Be Deleted

### Frontend (~28KB)
```
frontend/lib/auth-context.tsx        # Replaced by Clerk
frontend/lib/auth-final-guide.tsx    # Documentation
frontend/lib/auth-usage-guide.tsx    # Documentation
```

### Backend (~60KB)
```
backend/src/modules/iam/services/AuthService.ts       # Legacy auth
backend/src/modules/iam/services/JwtService.ts        # JWT handling
backend/src/modules/iam/services/PasswordService.ts   # Password hashing
backend/src/modules/iam/controllers/AuthController.ts # Login/register
backend/src/modules/iam/middleware/auth.ts            # Legacy middleware
backend/src/modules/iam/middleware/unifiedAuth.ts     # Dual auth (post-migration)
```

### Database
```sql
DROP TABLE refresh_tokens;
ALTER TABLE users RENAME COLUMN password_hash TO _deprecated_password_hash;
-- After 90 days: DROP COLUMN _deprecated_password_hash;
```

### Dependencies
```bash
npm uninstall jsonwebtoken bcrypt cookie-parser csrf
```

---

## Cleanup Checklist

### Pre-Cleanup (DO NOT SKIP)
- [ ] 100% users migrated (`clerk_id IS NOT NULL`)
- [ ] Zero JWT auth in logs (last 7 days)
- [ ] 30 days stable Clerk operation
- [ ] Full database backup
- [ ] Team notified
- [ ] Maintenance window scheduled

### Execution Order
```
1. Pre-cleanup verification
2. Create backup
3. Frontend cleanup
4. Backend cleanup
5. Database cleanup
6. Config cleanup
7. Dependency cleanup
8. Full verification
9. Deploy
```

### Post-Cleanup Verification
- [ ] All tests pass
- [ ] No build errors
- [ ] No console errors
- [ ] Auth flows work
- [ ] No 500 errors in logs
- [ ] Security scan clean

---

## Files Created

| File | Purpose |
|------|---------|
| `CLEANUP_PLAN.md` | Detailed cleanup guide |
| `CLEANUP_SUMMARY.md` | This quick reference |
| `scripts/cleanup-legacy-auth.sh` | Automated cleanup script |
| `backend/scripts/verify-cleanup.ts` | Post-cleanup verification |

---

## Rollback

```bash
# Code rollback
git revert HEAD~1

# Database rollback
psql muslimeen < backup_YYYYMMDD/database.sql

# Feature flag rollback
USE_CLERK_AUTH=false
DUAL_AUTH_MODE=true
```

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| User lockout | Low | High | Full backup, rollback plan |
| Broken imports | Low | Medium | Verification script |
| Data loss | Very Low | Critical | DB backup, soft delete |
| Dependency issues | Medium | Low | Test in staging |

---

## Timeline

| Phase | Duration | When |
|-------|----------|------|
| Wait for stability | 30 days | After migration |
| Pre-cleanup verification | 1 day | Day 0 |
| Execution | 4 hours | Day 1 |
| Testing | 1 day | Day 1-2 |
| Deploy to staging | 2 hours | Day 2 |
| Deploy to production | 2 hours | Day 3 |
| Monitor | 7 days | Day 3-10 |
| Final cleanup (password_hash) | 1 hour | Day 90 |

---

## Success Metrics

| Metric | Before | After | Target |
|--------|--------|-------|--------|
| Codebase size | ~15MB | ~14.9MB | -2000 lines |
| Dependencies | 35 | 31 | -4 packages |
| Auth complexity | High | Low | Single method |
| Security surface | Large | Small | Reduced attack vectors |
| Build time | 45s | 40s | -10% |

---

## Questions?

- **When to execute?** After 30 days of 100% Clerk usage
- **What if something breaks?** Rollback via git revert + DB restore
- **Can we do partial cleanup?** No - all or nothing to avoid confusion
- **Who should execute?** Senior engineer with DB access
- **Maintenance window needed?** Yes - 2 hours recommended

---

## Related Docs

- [CLEANUP_PLAN.md](CLEANUP_PLAN.md) - Detailed instructions
- [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) - Migration process
- [AUTH_TEST_REPORT.md](AUTH_TEST_REPORT.md) - Current state validation
