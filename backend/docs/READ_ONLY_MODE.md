# System Read-Only Mode

**DATE**: 2026-03-20  
**PURPOSE**: Allow system to enter read-only mode during critical operations

---

## Overview

The read-only mode feature allows the system to safely pause write operations during:
- Database maintenance
- Data consistency checks
- Emergency situations
- Critical deployments

---

## Configuration

### Environment Variable

```bash
# Enable read-only mode
SYSTEM_READ_ONLY=true

# Normal operation (default)
SYSTEM_READ_ONLY=false
```

Add to `backend/.env`:
```bash
# =============================================================================
# SYSTEM SAFETY MODE (Read-Only)
# =============================================================================
SYSTEM_READ_ONLY=false
```

---

## Behavior

### When `SYSTEM_READ_ONLY=true`

| HTTP Method | Status | Behavior |
|-------------|--------|----------|
| `GET` | ✅ Allowed | Read operations work normally |
| `HEAD` | ✅ Allowed | Read operations work normally |
| `OPTIONS` | ✅ Allowed | CORS preflight works |
| `POST` | ❌ Blocked | Returns 503 error |
| `PUT` | ❌ Blocked | Returns 503 error |
| `PATCH` | ❌ Blocked | Returns 503 error |
| `DELETE` | ❌ Blocked | Returns 503 error |

### Exempt Paths

The following paths are always allowed (even in read-only mode):
- `/health` - Health checks
- `/health/*` - All health endpoints
- `/api/health` - API health checks
- `/status` - Status endpoint

---

## Error Response

When a write operation is blocked:

```json
{
  "success": false,
  "error": {
    "code": "SYSTEM_READ_ONLY",
    "message": "System is currently in read-only mode. Write operations are temporarily disabled.",
    "details": {
      "reason": "System maintenance or data consistency protection",
      "allowedMethods": ["GET", "HEAD", "OPTIONS"],
      "retryAfter": 300
    }
  },
  "meta": {
    "readOnlyMode": true,
    "timestamp": "2026-03-20T12:00:00.000Z"
  }
}
```

HTTP Status: `503 Service Unavailable`

---

## Health Check Integration

Read-only mode status is exposed in health endpoints:

### GET /health
```json
{
  "status": "healthy",
  "readOnlyMode": true,
  "checks": [...],
  ...
}
```

### GET /status
```json
{
  "status": "ok",
  "readOnlyMode": true
}
```

### Root Endpoint /
```json
{
  "name": "MuslimEEN API",
  "readOnlyMode": true,
  ...
}
```

---

## Middleware

### Location
`backend/src/modules/shared/middleware/readOnlyMode.ts`

### Usage
```typescript
import { readOnlyMode } from './modules/shared/middleware/readOnlyMode';

// Apply globally (in server.ts)
app.use(readOnlyMode);
```

### Conditional Usage
```typescript
import { conditionalReadOnlyMode } from './modules/shared/middleware/readOnlyMode';

// Apply only to specific routes
router.use('/critical-data', conditionalReadOnlyMode(true));
```

---

## Logging

When write operations are blocked:
```
[WARN] Write operation blocked - system in read-only mode
  method: POST
  path: /api/users
  ip: 192.168.1.1
```

---

## Implementation Details

### File Changes

| File | Change |
|------|--------|
| `config/env.ts` | Added `SYSTEM_READ_ONLY` env variable and `isReadOnlyMode()` helper |
| `server.ts` | Added `readOnlyMode` middleware to Express pipeline |
| `routes/health.ts` | Added `readOnlyMode` status to health responses |
| `.env.example` | Documented `SYSTEM_READ_ONLY` configuration |

### Code Structure

```
backend/src/modules/shared/middleware/readOnlyMode.ts
├── readOnlyMode()           - Main middleware
├── conditionalReadOnlyMode() - Factory for conditional application
├── getReadOnlyStatus()      - Status helper
└── Admin endpoint handlers   - Placeholder for dynamic toggle
```

---

## Toggle Instructions

### Enable Read-Only Mode

1. Set environment variable:
   ```bash
   SYSTEM_READ_ONLY=true
   ```

2. Restart the server:
   ```bash
   pm2 restart backend
   ```

3. Verify via health check:
   ```bash
   curl /api/health | jq '.readOnlyMode'
   # Expected: true
   ```

### Disable Read-Only Mode

1. Set environment variable:
   ```bash
   SYSTEM_READ_ONLY=false
   ```

2. Restart the server:
   ```bash
   pm2 restart backend
   ```

---

## Success Criteria

✅ **System can safely pause writes** - All POST/PUT/PATCH/DELETE blocked when enabled  
✅ **No data inconsistency during maintenance** - Write operations prevented  
✅ **Easy to toggle** - Single env variable change  
✅ **Normal operations unaffected when disabled** - Pass-through middleware when disabled  

---

## Future Enhancements

1. **Dynamic Toggle**: Allow enabling/disabling without restart via admin API
2. **Gradual Rollout**: Per-user or per-route read-only mode
3. **Scheduled Mode**: Auto-enable during maintenance windows
4. **Webhook Notifications**: Alert when read-only mode is toggled
