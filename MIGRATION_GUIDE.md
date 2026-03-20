# User Migration Guide: Legacy Auth → Clerk

**DATE**: 2026-03-20  
**STATUS**: Ready for Testing  
**RISK LEVEL**: Medium (mitigated with feature flags)

---

## Overview

This guide describes how to migrate existing users from legacy JWT authentication to Clerk **without breaking access**.

### Key Principles

1. **Zero Downtime**: Users can continue logging in during migration
2. **Zero Data Loss**: All user data preserved
3. **Safe Rollback**: Feature flags allow instant reversion
4. **Gradual Rollout**: Migrate users in batches

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     MIGRATION ARCHITECTURE                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   PHASE 1: DUAL AUTH MODE                                               │
│   ┌──────────┐     ┌──────────────┐     ┌──────────────┐               │
│   │  User    │────▶│   Backend    │────▶│   Clerk      │               │
│   │  Login   │     │   Try Both   │     │   (new)      │               │
│   └──────────┘     └──────────────┘     └──────────────┘               │
│                            │                                            │
│                            ▼                                            │
│                     ┌──────────────┐                                    │
│                     │   Legacy     │                                    │
│                     │   JWT        │                                    │
│                     └──────────────┘                                    │
│                                                                         │
│   PHASE 2: FULL MIGRATION                                               │
│   ┌──────────┐     ┌──────────────┐     ┌──────────────┐               │
│   │  User    │────▶│   Clerk      │────▶│   Backend    │               │
│   │  Login   │     │   Only       │     │   Verify     │               │
│   └──────────┘     └──────────────┘     └──────────────┘               │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Migration Steps

### Step 0: Pre-Migration Checklist

- [ ] Database backup created
- [ ] `clerk_id` column added to users table
- [ ] Clerk account configured
- [ ] Environment variables set
- [ ] Rollback plan documented

### Step 1: Database Preparation

The `clerk_id` column should already exist (added in migration 008):

```sql
-- Verify column exists
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'clerk_id';

-- Check how many users need migration
SELECT COUNT(*) as users_to_migrate 
FROM users 
WHERE clerk_id IS NULL OR clerk_id = '';
```

### Step 2: Configure Feature Flags

Add to backend `.env`:

```bash
# Feature Flags
USE_CLERK_AUTH=false           # Start with legacy auth
USE_CLERK_WEBHOOKS=false       # Disable until migration starts
USE_MAGIC_LINKS=true           # Enable for migrated users
DUAL_AUTH_MODE=false           # Enable for gradual rollout
CLERK_ROLLOUT_PERCENTAGE=0     # Start at 0%, increase gradually
```

### Step 3: Test Migration Script (Dry Run)

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Run migration in dry-run mode (no actual changes)
MIGRATION_DRY_RUN=true npm run migrate:users-to-clerk

# Check logs - should show users that would be migrated
```

### Step 4: Migrate a Test User

```bash
# Migrate a single test user (set their email in env)
MIGRATION_DRY_RUN=false \
MIGRATION_BATCH_SIZE=1 \
npm run migrate:users-to-clerk
```

### Step 5: Enable Dual Auth Mode

Update backend `.env`:

```bash
DUAL_AUTH_MODE=true
CLERK_ROLLOUT_PERCENTAGE=5    # Start with 5% of users
```

Restart backend server.

### Step 6: Gradual Rollout

Increase percentage gradually over days/weeks:

| Day | Percentage | Action |
|-----|------------|--------|
| 1   | 5%         | Monitor for errors |
| 2   | 10%        | Check support tickets |
| 3   | 25%        | Monitor performance |
| 4   | 50%        | Monitor closely |
| 5   | 75%        | Almost complete |
| 6   | 100%       | Full rollout |

Update `.env` each day:
```bash
CLERK_ROLLOUT_PERCENTAGE=25
```

### Step 7: Full Migration

When all users are migrated:

```bash
# Update .env
USE_CLERK_AUTH=true
USE_CLERK_WEBHOOKS=true
DUAL_AUTH_MODE=false
```

### Step 8: Cleanup

After 30 days of stable operation:

1. Remove legacy JWT code
2. Remove feature flags
3. Archive migration scripts

---

## Migration Script

**Location**: `backend/scripts/migrate-users-to-clerk.ts`

### Usage

```bash
# Dry run (recommended first step)
MIGRATION_DRY_RUN=true npm run migrate:users-to-clerk

# Live migration
MIGRATION_DRY_RUN=false npm run migrate:users-to-clerk

# Custom batch size
MIGRATION_BATCH_SIZE=50 npm run migrate:users-to-clerk

# With rate limiting delay
MIGRATION_DELAY_MS=500 npm run migrate:users-to-clerk
```

### What It Does

1. **Fetches users** without `clerk_id`
2. **Creates Clerk user** with metadata:
   - `role`: User's role
   - `verificationTier`: Verification level
   - `trustScore`: Trust score
   - `invitesRemaining`: Invite quota
   - `migratedAt`: Timestamp
3. **Updates database** with `clerk_id`
4. **Creates magic link** for password setup

### Password Strategy

Users don't need to know their passwords were migrated:

1. User tries to login with old password
2. Backend detects user has `clerk_id`
3. Redirects to Clerk login
4. User clicks "Forgot password" or uses magic link
5. Sets new password
6. Future logins use Clerk

---

## Feature Flags

**Location**: `backend/src/config/featureFlags.ts`

### Flags

| Flag | Description | Default |
|------|-------------|---------|
| `USE_CLERK_AUTH` | Use only Clerk | `false` |
| `USE_CLERK_WEBHOOKS` | Process Clerk webhooks | `false` |
| `USE_MAGIC_LINKS` | Enable magic link auth | `true` |
| `DUAL_AUTH_MODE` | Try both auth methods | `false` |
| `CLERK_ROLLOUT_PERCENTAGE` | % of users on Clerk | `0` |

### Runtime Control

```typescript
import { featureFlags } from './config/featureFlags';

// Enable Clerk for all users
featureFlags.enable('USE_CLERK_AUTH');

// Set rollout to 25%
featureFlags.setRolloutPercentage(25);

// Check if user should use Clerk
const useClerk = featureFlags.isClerkEnabledForUser(userId);
```

---

## Unified Auth Middleware

**Location**: `backend/src/modules/iam/middleware/unifiedAuth.ts`

Automatically handles both auth methods:

```typescript
import { unifiedAuthenticate } from './middleware/unifiedAuth';

// In router
router.use(unifiedAuthenticate);

// Works with:
// - Legacy JWT tokens (Bearer <jwt>)
// - Clerk JWT tokens (Bearer <clerk-jwt>)
```

### Auth Detection Logic

1. If `USE_CLERK_AUTH=true`: Use only Clerk
2. If `DUAL_AUTH_MODE=true`: Try Clerk first, fall back to JWT
3. Otherwise: Use only JWT

### Clerk Token Detection

The middleware automatically detects Clerk tokens by:
- Checking issuer claim (`iss` contains "clerk")
- Checking subject format (`sub` starts with "user_")

---

## Rollback Procedure

### Scenario: Critical Issue Found

```bash
# 1. Immediately disable Clerk
USE_CLERK_AUTH=false
DUAL_AUTH_MODE=false

# 2. Restart backend
npm restart

# 3. All users now use legacy JWT again
```

### Scenario: Specific User Can't Login

```sql
-- Temporarily remove clerk_id to force JWT auth
UPDATE users SET clerk_id = NULL WHERE email = 'user@example.com';
```

### Scenario: Data Corruption

1. Stop migration script
2. Restore database from backup
3. Disable Clerk features
4. Investigate root cause

---

## Monitoring

### Key Metrics

```typescript
// Users migrated
SELECT COUNT(*) FROM users WHERE clerk_id IS NOT NULL;

// Users remaining
SELECT COUNT(*) FROM users WHERE clerk_id IS NULL;

// Login failures by auth method
// Check application logs for "Clerk auth failed" vs "JWT auth failed"
```

### Alerts

Set up alerts for:
- Login failure rate > 5%
- Migration script errors
- Clerk API errors
- Database connection issues

---

## Testing

### Pre-Migration Tests

```bash
# 1. Test migration script (dry run)
MIGRATION_DRY_RUN=true npm run migrate:users-to-clerk

# 2. Test with single user
MIGRATION_BATCH_SIZE=1 MIGRATION_DRY_RUN=false npm run migrate:users-to-clerk

# 3. Test login with migrated user
# - Login should work via Clerk
# - Profile should be intact
```

### Post-Migration Tests

```bash
# 1. Test all auth flows
# - Login
# - Logout
# - Password reset
# - Magic link

# 2. Test API access
# - All protected endpoints
# - Token refresh

# 3. Test webhooks
# - User update in Clerk → sync to DB
```

---

## Troubleshooting

### User Can't Login After Migration

**Symptoms**: User gets "Invalid credentials"

**Diagnosis**:
```sql
-- Check if user is migrated
SELECT clerk_id FROM users WHERE email = 'user@example.com';
```

**Solution**:
1. If `clerk_id` exists: User needs to reset password
2. If `clerk_id` is NULL: User should use old login

### Migration Script Fails

**Symptoms**: Script exits with errors

**Common Causes**:
- `CLERK_SECRET_KEY` not set
- Database connection failed
- Clerk API rate limit

**Solutions**:
```bash
# Check environment
echo $CLERK_SECRET_KEY

# Reduce batch size
MIGRATION_BATCH_SIZE=10 npm run migrate:users-to-clerk

# Add delay between requests
MIGRATION_DELAY_MS=1000 npm run migrate:users-to-clerk
```

### Duplicate Users in Clerk

**Symptoms**: "form_identifier_exists" error

**Solution**: Script automatically handles this by:
1. Finding existing Clerk user
2. Updating metadata
3. Linking to database

---

## Environment Variables Reference

### Backend

```bash
# Clerk Configuration
CLERK_SECRET_KEY=sk_test_...
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Feature Flags
USE_CLERK_AUTH=false
USE_CLERK_WEBHOOKS=false
USE_MAGIC_LINKS=true
DUAL_AUTH_MODE=false
CLERK_ROLLOUT_PERCENTAGE=0

# Migration
MIGRATION_DRY_RUN=true
MIGRATION_BATCH_SIZE=100
MIGRATION_DELAY_MS=100
```

### Frontend

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/register
```

---

## Success Criteria

- [x] `clerk_id` column exists in users table
- [x] Migration script created and tested
- [x] Feature flag system implemented
- [x] Unified auth middleware working
- [x] Rollback procedure documented
- [ ] All users migrated to Clerk
- [ ] Zero login failures
- [ ] No data loss
- [ ] Old auth code removed (after 30 days)

---

## Timeline

| Phase | Duration | Description |
|-------|----------|-------------|
| Preparation | 1 day | Setup, testing, dry runs |
| Pilot | 2 days | 5% of users |
| Rollout | 1 week | Gradual increase to 100% |
| Stabilization | 2 weeks | Monitor and fix issues |
| Cleanup | 1 day | Remove legacy code |

---

## Support

For migration issues:

1. Check logs: `tail -f logs/migration.log`
2. Verify feature flags: Check `.env` values
3. Test auth: Try both JWT and Clerk tokens
4. Rollback if needed: Set `USE_CLERK_AUTH=false`
