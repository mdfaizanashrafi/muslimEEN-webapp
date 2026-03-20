# Idempotent Cleanup Scripts

**DATE**: 2026-03-20  
**OBJECTIVE**: Ensure all cleanup scripts can run multiple times without errors

---

## Summary

All cleanup scripts and migrations have been updated to be **idempotent** - safe to run multiple times without causing errors or duplicate actions.

---

## Changes Made

### 1. Database Migrations

#### `008_add_clerk_auth.sql` - Updated
**Before:**
```sql
ALTER TABLE users ADD COLUMN clerk_id VARCHAR(255) UNIQUE;  -- Fails on re-run
CREATE INDEX idx_users_clerk_id ON users(clerk_id);         -- Fails on re-run
```

**After:**
```sql
-- Idempotent column addition
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'clerk_id'
    ) THEN
        ALTER TABLE users ADD COLUMN clerk_id VARCHAR(255) UNIQUE;
    END IF;
END $$;

-- Idempotent index creation
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'users' AND indexname = 'idx_users_clerk_id'
    ) THEN
        CREATE INDEX idx_users_clerk_id ON users(clerk_id);
    END IF;
END $$;
```

#### `010_cleanup_legacy_auth.sql` - New
Comprehensive idempotent cleanup migration with:
- **Pre-check**: Verifies all users have `clerk_id` before cleanup
- **Safe DROPs**: Uses `IF EXISTS` for all table/index drops
- **Safe column rename**: Checks both old and new column names
- **Verification**: Reports status after each operation

**Key Features:**
```sql
-- Safe table drop
IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'refresh_tokens') 
THEN DROP TABLE refresh_tokens CASCADE; 
END IF;

-- Safe column rename with double-check
IF EXISTS (SELECT 1 FROM columns WHERE column_name = 'password_hash')
AND NOT EXISTS (SELECT 1 FROM columns WHERE column_name = '_deprecated_password_hash')
THEN 
    ALTER TABLE users RENAME COLUMN password_hash TO _deprecated_password_hash;
END IF;
```

---

### 2. Shell Scripts

#### `scripts/cleanup-legacy-auth.sh` - Updated

**Idempotency Improvements:**

| Check | Behavior |
|-------|----------|
| Backup directory | Skip if already exists for timestamp |
| Git tag | Skip if tag already exists |
| Git commit | Only commit if there are uncommitted changes |
| File deletion | Check if already deleted before attempting |
| api.ts cleanup | Skip if `LEGACY:` comment already present |
| routes.ts simplification | Skip if `Clerk Only` comment already present |
| .env cleanup | Skip if `# REMOVED:` prefix already present |

**Example:**
```bash
# Skip if backup already exists
if [ -d "$BACKUP_DIR" ] && [ -f "$BACKUP_DIR/database.sql" ]; then
    log_warn "Backup already exists at $BACKUP_DIR"
    log_warn "Skipping backup creation (safe to re-run)"
else
    # Create backup...
fi

# Skip if already processed
if grep -q "LEGACY: export const setCsrfToken" frontend/lib/api.ts; then
    log_info "api.ts already cleaned (skipping)"
fi
```

#### `scripts/production-cleanup.sh` - Updated

**Idempotency Improvements:**
- Skip git tag creation if tag exists
- Skip database backup if file exists
- Skip code backup if directories exist
- Log "Already deleted" for missing files

---

### 3. TypeScript Scripts

#### `create-admin-clerk.ts` - Already Idempotent
Uses `ON CONFLICT (email) DO UPDATE SET` for safe re-runs:
```sql
INSERT INTO users (...) VALUES (...)
ON CONFLICT (email) DO UPDATE SET
  clerk_id = $2,
  role = 'admin',
  ...
```

#### `migrate-users-to-clerk.ts` - Already Idempotent
Only migrates users where `clerk_id IS NULL`:
```sql
SELECT * FROM users WHERE clerk_id IS NULL OR clerk_id = ''
```

---

## Safe Re-Run Scenarios

### Scenario 1: Migration Interrupted
```bash
# First run - partially completes
npm run migrate:users-to-clerk
# → Stops halfway due to network error

# Second run - safely continues
npm run migrate:users-to-clerk  
# → Skips already migrated users, continues from where it left off
```

### Scenario 2: Database Cleanup Re-Run
```bash
# First run
psql $DATABASE_URL < 010_cleanup_legacy_auth.sql
# → Drops refresh_tokens, renames password_hash

# Second run
psql $DATABASE_URL < 010_cleanup_legacy_auth.sql
# → "refresh_tokens does not exist (already cleaned)"
# → "password_hash already renamed to _deprecated_password_hash"
```

### Scenario 3: Shell Script Re-Run
```bash
# First run
./scripts/production-cleanup.sh
# → Creates backup, deletes files, generates SQL

# Second run (accidental)
./scripts/production-cleanup.sh
# → "Backup already exists (skipping)"
# → "Already deleted: frontend/lib/auth-context.tsx"
# → Completes without errors
```

---

## Safety Mechanisms

### 1. Pre-Checks
All scripts verify preconditions before making changes:
- Database migrations check if objects exist
- Shell scripts check if files exist
- TypeScript scripts check database state

### 2. Atomic Operations
Where possible, operations are atomic:
- SQL transactions for database changes
- Git commits for code changes
- Separate backup creation before deletion

### 3. Clear Feedback
Scripts report what they're skipping:
```
[INFO] Already deleted: frontend/lib/auth-context.tsx
[INFO] api.ts already cleaned (skipping)
[INFO] routes.ts already simplified (skipping)
```

### 4. Rollback Preservation
Backups are never overwritten:
- Timestamped backup directories
- Git tags with timestamps
- Database backups with timestamps

---

## Verification

### Test Idempotency
```bash
# Run migration twice
psql $DATABASE_URL < 010_cleanup_legacy_auth.sql
psql $DATABASE_URL < 010_cleanup_legacy_auth.sql
# → Both should succeed with "already cleaned" messages

# Run shell script twice
./scripts/cleanup-legacy-auth.sh execute
./scripts/cleanup-legacy-auth.sh execute
# → Both should succeed with "skipping" messages
```

### Verify State
```bash
# Check database
psql $DATABASE_URL -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'users';"

# Check files
ls -la frontend/lib/auth-context.tsx  # Should not exist
ls -la backend/src/modules/iam/services/AuthService.ts  # Should not exist
```

---

## Summary Table

| Script/Module | Before | After | Safe for Re-Run |
|--------------|--------|-------|-----------------|
| `008_add_clerk_auth.sql` | Direct ALTER/CREATE | IF NOT EXISTS checks | ✅ Yes |
| `010_cleanup_legacy_auth.sql` | N/A | IF EXISTS checks | ✅ Yes |
| `cleanup-legacy-auth.sh` | Some checks | Comprehensive checks | ✅ Yes |
| `production-cleanup.sh` | Some checks | Comprehensive checks | ✅ Yes |
| `create-admin-clerk.ts` | ON CONFLICT UPDATE | Already idempotent | ✅ Yes |
| `migrate-users-to-clerk.ts` | WHERE clerk_id IS NULL | Already idempotent | ✅ Yes |

---

## Success Criteria

✅ **Script runs safely multiple times** - All scripts check state before acting  
✅ **No duplicate actions** - Operations skipped if already performed  
✅ **No crashes on re-run** - Graceful handling of missing objects  
✅ **Clear logging** - Reports what's being skipped  
✅ **Preserved purpose** - Original functionality unchanged  
