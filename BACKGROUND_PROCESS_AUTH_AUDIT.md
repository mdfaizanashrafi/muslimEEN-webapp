# Background Process Auth Audit Report

**Staff-Level Backend Audit**  
**DATE**: 2026-03-20  
**STATUS**: ⚠️ Issues Found - Action Required  
**AUDITOR**: Code Review

---

## Executive Summary

| Category | Status | Count |
|----------|--------|-------|
| Cron Jobs | ✅ Clean | 0 found |
| Worker Queues | ✅ Clean | 0 found |
| CLI Scripts | ⚠️ Issues | 3 need updates |
| Test Helpers | ⚠️ Issues | 2 need updates |
| Event Bus | ✅ Clean | No auth issues |
| Database Migrations | ✅ Clean | No auth issues |

**Risk Level**: Medium (test and script updates needed before production)

---

## 🔍 Audit Methodology

### Search Patterns Used
```bash
# Background processes
grep -r "cron\|schedule\|worker\|queue\|job\|task" backend/src/

# Auth patterns
grep -r "jwt\|JWT\|token\|authorization" backend/src/ --include="*.ts"
grep -r "cookie\|Cookie\|csrf\|CSRF" backend/src/ --include="*.ts"

# Scripts
glob: backend/scripts/*
glob: backend/database/**/*
```

### Files Examined
- 96 TypeScript source files
- 14 script files
- 13 database migration files
- EventBus implementation
- All middleware files

---

## ✅ Clean Components

### 1. Cron Jobs / Scheduled Tasks
**Status**: No cron jobs found

No cron job libraries (node-cron, bull, agenda, etc.) detected in dependencies or code.

### 2. Worker Queues
**Status**: No worker queues found

No queue systems (Bull, Bee, RabbitMQ, etc.) detected.

### 3. Event Bus
**Status**: Clean - No auth issues

**File**: `backend/src/modules/shared/events/EventBus.ts`

The EventBus is a simple pub/sub system with no authentication. Events are:
- Published synchronously
- Handled in-process
- No network calls or external APIs

**Events that trigger auth-related actions**:
- `USER_REGISTERED` - Handled by Clerk webhook
- `USER_AUTHENTICATED` - Legacy, can be removed
- `INVITE_USED` - Database only, no auth

### 4. Database Migrations
**Status**: Clean

**Files**: `backend/database/migrations/*.sql`

All migrations are schema changes only. No JWT/token generation in migrations.

---

## ⚠️ Issues Found

### Issue 1: Admin Creation Script

**File**: `backend/scripts/create-admin.ts`

**Problem**: Creates users with legacy password hashing

```typescript
// Lines 23-28: Custom password hashing
const hashPassword = (password: string): string => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
};

// Line 63-86: Inserts password_hash directly
const result = await pool.query(
  `INSERT INTO users (email, password_hash, ...)
   VALUES ($1, $2, ...)
   ON CONFLICT (email) DO UPDATE SET
     role = 'admin',
     invites_remaining = 999999`,
  [email, passwordHash, ...]
);
```

**Impact**: 
- Creates admin users that can't login via Clerk
- Password stored in legacy format

**Fix Required**:
```typescript
// Replace with Clerk user creation
import { clerkClient } from '@clerk/clerk-sdk-node';

const createAdminUser = async (input) => {
  // Create in Clerk first
  const clerkUser = await clerkClient.users.createUser({
    emailAddress: [input.email],
    password: input.password,
    firstName: input.firstName,
    lastName: input.lastName,
    publicMetadata: { role: 'admin', verificationTier: 'advanced' }
  });
  
  // Create in our DB with clerk_id
  await pool.query(
    `INSERT INTO users (email, clerk_id, first_name, last_name, role, ...)
     VALUES ($1, $2, $3, $4, 'admin', ...)
     ON CONFLICT (email) DO UPDATE SET
       role = 'admin',
       clerk_id = $2`,
    [email, clerkUser.id, firstName, lastName]
  );
};
```

---

### Issue 2: Seed User Script

**File**: `backend/scripts/seed-user.js`

**Problem**: Uses bcrypt for password hashing

```javascript
// Line 9: Uses bcrypt
const bcrypt = require('bcrypt');

// Line 42: Hashes password with bcrypt
const passwordHash = await bcrypt.hash('TestPass123!', 12);

// Line 44-49: Inserts into database
await client.query(`
  INSERT INTO users (id, email, password_hash, ...)
  VALUES (gen_random_uuid(), 'test@example.com', $1, ...)
`, [passwordHash]);
```

**Impact**:
- Test users can't login via Clerk
- Dependency on bcrypt package

**Fix Required**:
```javascript
// Use Clerk API instead
const { clerkClient } = require('@clerk/clerk-sdk-node');

const clerkUser = await clerkClient.users.createUser({
  emailAddress: ['test@example.com'],
  password: 'TestPass123!',
  firstName: 'Test',
  lastName: 'User',
});

// Then create DB record with clerk_id
await pool.query(`
  INSERT INTO users (email, clerk_id, first_name, last_name, ...)
  VALUES ($1, $2, 'Test', 'User', ...)
`, ['test@example.com', clerkUser.id]);
```

---

### Issue 3: Fix Admin Password Script

**File**: `backend/scripts/fix-admin-password.js`

**Problem**: Direct password hash manipulation

```javascript
// Line 1: Uses bcrypt
const bcrypt = require('bcrypt');

// Line 17: Creates bcrypt hash
const passwordHash = await bcrypt.hash(password, 12);

// Line 21-23: Updates database directly
await pool.query(
  'UPDATE users SET password_hash = $1 WHERE id = $2',
  [passwordHash, userId]
);
```

**Impact**:
- Bypasses Clerk authentication
- Creates inconsistent auth state

**Fix Required**:
```javascript
// Update via Clerk API
const { clerkClient } = require('@clerk/clerk-sdk-node');

// Get user by email first
const user = await pool.query('SELECT clerk_id FROM users WHERE id = $1', [userId]);

// Update in Clerk
await clerkClient.users.updateUser(user.rows[0].clerk_id, {
  password: newPassword
});
```

---

### Issue 4: Test Helpers

**File**: `backend/src/__tests__/helpers.ts`

**Problem**: Uses legacy auth endpoints

```typescript
// Lines 37-51: loginTestUser uses old login endpoint
export const loginTestUser = async (app, email, password): Promise<string> => {
  const response = await request(app)
    .post('/api/auth/login')  // Legacy endpoint
    .send({ email, password });
  
  return response.body.data.token;  // Returns JWT
};
```

**Impact**:
- Tests will fail with Clerk migration
- Relies on removed endpoints

**Fix Required**:
```typescript
// Use Clerk for test authentication
import { clerkClient } from '@clerk/clerk-sdk-node';

export const createTestUser = async (app, userData, inviteToken) => {
  // Create via Clerk webhook or direct API
  // Return Clerk session token instead of JWT
};

export const getTestAuthToken = async (email, password) => {
  // Use Clerk's sign-in API
  const signIn = await clerkClient.signIns.create({
    identifier: email,
    password
  });
  return signIn.createdSessionId;
};
```

---

### Issue 5: Auth Integration Tests

**File**: `backend/src/__tests__/integration/auth.test.ts`

**Problem**: Tests legacy JWT authentication

```typescript
// Lines 51-86: Tests JWT token return
it('should register a new user with valid data', async () => {
  const response = {
    status: 201,
    body: {
      data: {
        user: { ... },
        token: 'jwt-token',  // Legacy JWT
      }
    }
  };
});
```

**Impact**:
- Tests validate removed functionality
- Will fail in CI/CD

**Fix Required**:
```typescript
// Test Clerk-based auth
it('should authenticate via Clerk', async () => {
  // Test Clerk session creation
  // Test session validation
  // Test logout
});
```

---

## 📋 Remediation Plan

### Phase 1: Scripts (Priority: High)

| Script | Action | Owner | ETA |
|--------|--------|-------|-----|
| `create-admin.ts` | Refactor to use Clerk | Backend | 1 day |
| `seed-user.js` | Refactor to use Clerk | Backend | 1 day |
| `fix-admin-password.js` | Refactor to use Clerk | Backend | 1 day |

### Phase 2: Tests (Priority: Medium)

| File | Action | Owner | ETA |
|------|--------|-------|-----|
| `helpers.ts` | Update auth helpers | QA | 2 days |
| `auth.test.ts` | Rewrite for Clerk | QA | 2 days |
| `auth.flow.test.ts` | Update flow tests | QA | 1 day |

### Phase 3: Cleanup (Priority: Low)

| Action | Details |
|--------|---------|
| Remove bcrypt | Uninstall after script updates |
| Update seed data | Use Clerk-created users |
| Document test auth | Write guide for test authentication |

---

## 🔒 Security Considerations

### Current Risks
1. **Inconsistent Auth State**: Scripts create users Clerk doesn't know about
2. **Password Hash Leakage**: Legacy hashes in database
3. **Test Data Pollution**: Test users bypass invite system

### Mitigation
1. All scripts must use Clerk API
2. Test users should be created via Clerk webhooks
3. Document internal API key auth for service-to-service

---

## ✅ Verification Checklist

- [ ] `create-admin.ts` uses Clerk
- [ ] `seed-user.js` uses Clerk
- [ ] `fix-admin-password.js` removed or updated
- [ ] Test helpers use Clerk
- [ ] All tests pass
- [ ] bcrypt removed from dependencies
- [ ] Documentation updated

---

## 📊 Audit Statistics

```
Files Scanned:        96 source files
Scripts Examined:     14 files
Issues Found:         5
Critical:             0
High:                 3
Medium:               2
Low:                  0

Estimated Fix Time:   5 days
```

---

## 🎯 Success Criteria

- [x] No cron jobs using legacy auth
- [x] No worker queues using legacy auth
- [ ] All CLI scripts use Clerk (3 remaining)
- [ ] All tests use Clerk (2 files remaining)
- [ ] No JWT generation in background
- [ ] No cookie-based auth in scripts
- [ ] All internal processes auth-safe

---

## 🔗 Related Documentation

- [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) - User migration process
- [CLERK_WEBHOOKS.md](CLERK_WEBHOOKS.md) - Clerk integration
- [PRODUCTION_CLEANUP_RUNBOOK.md](PRODUCTION_CLEANUP_RUNBOOK.md) - Cleanup procedures

---

**END OF AUDIT**

*Audit completed: 2026-03-20*  
*Next review: After script remediation*
