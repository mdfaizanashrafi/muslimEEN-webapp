# Internal API Implementation

**Staff-Level Backend Implementation**  
**DATE**: 2026-03-20  
**STATUS**: ✅ Complete

---

## Overview

Secured internal service-to-service communication using API key authentication (NOT Clerk/JWT).

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     INTERNAL API FLOW                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐         ┌──────────────┐                     │
│  │   Service A  │────────▶│  Internal API │                     │
│  │  (Background │         │   Endpoint    │                     │
│  │    Job)      │         │               │                     │
│  └──────────────┘         └──────┬────────┘                     │
│           │                      │                              │
│           │ x-internal-api-key   │ internalApiAuth              │
│           │ Header               │ Middleware                   │
│           │                      ▼                              │
│           │               ┌──────────────┐                     │
│           │               │  Validate    │                     │
│           │               │  API Key     │                     │
│           │               └──────┬───────┘                     │
│           │                      │                              │
│           │                      │ Valid?                       │
│           │                      ▼                              │
│           │               ┌──────────────┐                     │
│           │               │  Process     │                     │
│           └───────────────│  Request     │                     │
│                           └──────────────┘                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Files Created

| File | Purpose |
|------|---------|
| `internal/routes.ts` | Internal API endpoints |
| `internal/client.ts` | Client for making internal calls |
| `shared/auth/InternalApiAuth.ts` | API key middleware |
| `scripts/create-api-key.ts` | CLI to generate API keys |
| `database/migrations/009_create_api_keys.sql` | Database schema |

---

## Quick Start

### 1. Create an API Key

```bash
cd backend
npx ts-node scripts/create-api-key.ts --name="Data Sync Service" --scope=write --expires=90
```

Output:
```
╔════════════════════════════════════════════════════════════╗
║              API KEY CREATED - SAVE SECURELY               ║
╚════════════════════════════════════════════════════════════╝

Key ID: abc-123
Name: Data Sync Service
Scope: write
Expires: 2024-06-20T00:00:00.000Z

⚠️  API KEY (copy now - will not be shown again):
musl_a1b2c3d4e5f6_1699123456789

⚠️  Store this key securely. It cannot be retrieved later.
```

### 2. Set Environment Variable

```bash
# .env
INTERNAL_API_KEY=musl_a1b2c3d4e5f6_1699123456789
INTERNAL_API_URL=http://localhost:3001/api/internal
```

### 3. Use the Client

```typescript
import { internalApiClient } from '../modules/internal/client';

// Get system stats
const stats = await internalApiClient.get('/stats');
console.log(stats.data.users.total);

// Clear cache
await internalApiClient.post('/cache/clear', {});

// Publish event
await internalApiClient.post('/events/publish', {
  eventType: 'user.sync',
  payload: { userId: '123' }
});
```

---

## Available Endpoints

### Read Endpoints (scope: read)

```bash
GET /api/internal/stats
# Returns: { users: { total }, invites: { pending, used }, connections: { last24h } }

GET /api/internal/health/detailed
# Returns: { database: { status, time, version }, memory, uptime }
```

### Write Endpoints (scope: write)

```bash
POST /api/internal/cache/clear
# Clears application caches

POST /api/internal/events/publish
# Publishes event to event bus
Body: { eventType: string, payload: any }
```

### Admin Endpoints (scope: admin)

```bash
GET /api/internal/audit/logs?limit=100&offset=0
# Returns audit logs

POST /api/internal/maintenance
# Triggers maintenance tasks
Body: { task: string }
```

---

## Authentication

### Header Required

```
x-internal-api-key: musl_xxxxxxxx_xxxxxxxxx
```

### Scopes

| Scope | Access |
|-------|--------|
| `read` | GET endpoints only |
| `write` | GET + POST/PUT/PATCH |
| `admin` | All endpoints |

### Example Request

```bash
curl -X GET http://localhost:3001/api/internal/stats \
  -H "x-internal-api-key: musl_a1b2c3d4e5f6_1699123456789"
```

---

## Security Features

1. **API Key Hashing**: Keys are bcrypt hashed in database
2. **Expiration**: Keys can have expiration dates
3. **Scope Limiting**: Keys are limited to specific operations
4. **Audit Logging**: All access is logged with key ID
5. **No JWT**: Completely separate from user authentication
6. **No Cookies**: Header-based only

---

## Testing

```bash
# 1. Create admin key
npm run create:api-key -- --name="Test Key" --scope=admin

# 2. Set key in environment
export INTERNAL_API_KEY=musl_...

# 3. Test endpoint
curl http://localhost:3001/api/internal/stats \
  -H "x-internal-api-key: $INTERNAL_API_KEY"
```

---

## Integration with Existing System

### Router Integration

```typescript
// router.ts
import internalRoutes from './internal/routes';

// Add to router
router.use('/internal', internalRoutes);
```

### Middleware Chain

```
Request → internalApiAuth → requireScope → Handler
                ↓
         Validates API Key
                ↓
         Checks Scope Permission
                ↓
         Processes Request
```

---

## Migration Guide

### From Clerk/JWT Internal Calls

**Before**:
```typescript
// ❌ Don't use Clerk tokens for internal calls
const response = await fetch('/api/internal/stats', {
  headers: {
    'Authorization': `Bearer ${clerkToken}`  // Wrong!
  }
});
```

**After**:
```typescript
// ✅ Use API keys
import { internalApiClient } from './internal/client';
const response = await internalApiClient.get('/stats');
```

---

## Monitoring

All internal API access is logged:

```
[INFO] Internal API request authenticated { keyId, keyName, path, method }
[WARN] API key verification failed { keyPrefix }
```

Health check:
```bash
GET /api/health/auth
# Returns: { auth: { system: "clerk" }, internal: { ... } }
```

---

## Success Criteria

| Criteria | Status |
|----------|--------|
| No internal API relies on Clerk session | ✅ API key only |
| No JWT used internally | ✅ API key only |
| Internal APIs secured | ✅ Middleware protected |
| Existing routes not broken | ✅ Separate /internal prefix |

---

## Related Documentation

- [PRODUCTION_CLEANUP_RUNBOOK.md](PRODUCTION_CLEANUP_RUNBOOK.md)
- [InternalApiAuth.ts](backend/src/modules/shared/auth/InternalApiAuth.ts)
- [internal/routes.ts](backend/src/modules/internal/routes.ts)

---

**IMPLEMENTATION COMPLETE** ✅
