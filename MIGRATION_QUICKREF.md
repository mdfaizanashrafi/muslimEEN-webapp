# Migration Quick Reference

**ONE-PAGE CHEAT SHEET**

---

## Pre-Flight Checklist

```bash
# 1. Backup database
pg_dump muslimeen > backup_$(date +%Y%m%d).sql

# 2. Verify column exists
psql muslimeen -c "SELECT clerk_id FROM users LIMIT 1;"

# 3. Check env vars
grep CLERK backend/.env
grep USE_ backend/.env

# 4. Test dry run
cd backend && MIGRATION_DRY_RUN=true npm run migrate:users-to-clerk
```

---

## Migration Commands

```bash
# Dry run (safe)
MIGRATION_DRY_RUN=true npm run migrate:users-to-clerk

# Live migration (10 users)
MIGRATION_DRY_RUN=false MIGRATION_BATCH_SIZE=10 npm run migrate:users-to-clerk

# Full migration
MIGRATION_DRY_RUN=false npm run migrate:users-to-clerk
```

---

## Feature Flag States

| Phase | USE_CLERK | DUAL_MODE | ROLLOUT | WEBHOOKS |
|-------|-----------|-----------|---------|----------|
| Pre-migration | false | false | 0% | false |
| Testing | false | true | 5% | false |
| Rollout | false | true | 25-75% | true |
| Complete | true | false | 100% | true |
| Rollback | false | false | 0% | false |

---

## Emergency Rollback

```bash
# Stop migration
Ctrl+C

# Disable Clerk
sed -i 's/USE_CLERK_AUTH=true/USE_CLERK_AUTH=false/' backend/.env
sed -i 's/DUAL_AUTH_MODE=true/DUAL_AUTH_MODE=false/' backend/.env

# Restart
pm2 restart backend

# Verify
curl -H "Authorization: Bearer <old-jwt>" /api/users/me
```

---

## Common Issues

### "User already exists in Clerk"
→ **OK**: Script will link existing user

### "Invalid webhook signature"
→ Check `CLERK_WEBHOOK_SECRET` matches Clerk Dashboard

### "Migration script exits immediately"
→ Check `CLERK_SECRET_KEY` is set

### User can't login after migration
→ User needs password reset or magic link

---

## Monitoring Queries

```sql
-- Progress
SELECT 
  COUNT(*) FILTER (WHERE clerk_id IS NOT NULL) as migrated,
  COUNT(*) FILTER (WHERE clerk_id IS NULL) as pending,
  COUNT(*) as total
FROM users;

-- Failed migrations (check logs)
SELECT email, clerk_id 
FROM users 
WHERE clerk_id IS NULL 
ORDER BY updated_at DESC 
LIMIT 10;
```

---

## Key Files

| File | Purpose |
|------|---------|
| `backend/scripts/migrate-users-to-clerk.ts` | Migration script |
| `backend/src/config/featureFlags.ts` | Feature flags |
| `backend/src/modules/iam/middleware/unifiedAuth.ts` | Dual auth |
| `backend/src/modules/iam/controllers/ClerkWebhookController.ts` | Webhooks |

---

## Support Contacts

- **Technical**: DevOps team
- **User Issues**: Support team
- **Emergencies**: On-call engineer
