# Observability Optimization - Logging

**DATE**: 2026-03-20  
**OBJECTIVE**: Reduce noise in logging while preserving important signals

---

## Summary

Implemented sampling, throttling, and structured tagging for high-frequency logs to reduce noise while maintaining critical observability.

---

## Changes Made

### 1. New Module: `logSampler.ts`

**Location**: `backend/src/modules/shared/utils/logSampler.ts`

**Features**:
- **Sampling**: Configurable sample rates (0.0 - 1.0) per event type
- **Throttling**: Max logs per time window per endpoint/IP
- **Batch counters**: Suppressed event counts emitted periodically
- **Structured tags**: Consistent `module`, `type`, `subtype`, `severity` tags

**Default Sampling Rates**:

| Event Type | Sample Rate | Throttle | Notes |
|------------|-------------|----------|-------|
| `legacy_jwt_detected` | 10% | 5/min | High-frequency detection |
| `legacy_csrf_detected` | 10% | 5/min | High-frequency detection |
| `legacy_cookie_detected` | 10% | 5/min | High-frequency detection |
| `webhook_attempt` | 50% | 30s | Retry attempts |
| `webhook_retry` | 50% | - | Retry notices |
| `webhook_success` | 100% | - | Always log |
| `webhook_failure` | 100% | - | Always log (critical) |
| `security_event` | 100% | - | Always log |
| `error` | 100% | - | Always log |

---

### 2. Updated: `legacyAuthDetection.ts`

**Changes**:
- Replaced direct `logger.warn()` with `legacyAuthLog()`
- **10% sampling** for JWT/CSRF/cookie detection
- **Throttled** to max 5 logs per minute per endpoint/IP
- Added structured tags: `module: auth`, `type: legacy-detection`
- **Sentry alerts remain UNSAMPLED** (security critical)

**Before**:
```typescript
logger.warn(`Legacy ${type} usage detected`, logData);
```

**After**:
```typescript
legacyAuthLog(type, { endpoint, clientIp, userAgent, ...details });
// Only 10% logged, throttled, with structured tags
```

---

### 3. Updated: `WebhookRetryService.ts`

**Changes**:
- `webhook_attempt` - 50% sampling, throttled
- `webhook_retry` - 50% sampling
- `webhook_success` - 100% (always log)
- `webhook_failure` - 100% (always log, critical)
- `non_retryable_error` - 100% (always log, security)

---

### 4. Updated: `ClerkWebhookController.ts`

**Changes**:
- Added structured tags to ALL logs:
  ```typescript
  { tags: { module: 'auth', type: 'webhook', subtype: 'user.created' } }
  ```
- Security violations use `criticalLog()` (100% sampling):
  - `Signup attempted without invite code`
  - `Invalid invite code used for signup`
  - `Email does not match invite`

---

### 5. Updated: `legacyAuthBlocker.ts`

**Changes**:
- Security events use `criticalLog()` (100% sampling):
  - `Legacy JWT blocked`
  - `Legacy CSRF header blocked`
  - `Legacy auth cookie blocked`

---

## Log Structure

### Standard Format
```json
{
  "message": "Legacy jwt auth detected",
  "tags": {
    "module": "auth",
    "type": "legacy-detection",
    "subtype": "jwt",
    "severity": "medium"
  },
  "sampling": {
    "sampleRate": 0.1,
    "throttled": true,
    "suppressed": 23
  },
  "endpoint": "GET /api/users",
  "clientIp": "192.168.1.1",
  "timestamp": "2026-03-20T11:30:00.000Z"
}
```

---

## Monitoring

### Sampling Stats Endpoint
```typescript
import { getSamplingStats } from './utils/logSampler';

const stats = getSamplingStats();
// Returns: throttled types, suppressed counts, unique keys
```

### Sentry Integration
- All security events still sent to Sentry (unsampled)
- Tagged with `module: auth`, `type: legacy-detection`
- Breadcrumbs added for request context

---

## Success Criteria

✅ **No log flooding**: 90% reduction in legacy auth detection logs  
✅ **Important alerts remain visible**: Security events at 100%  
✅ **Logs are structured**: Consistent tags across all auth logs  
✅ **Throttling prevents spam**: Max 5 logs/min per endpoint/IP  
✅ **Suppression counts**: Know how many events were throttled  

---

## Rollback

To disable sampling for a specific event type:

```typescript
// In logSampler.ts, update DEFAULT_RATES
'legacy_jwt_detected': { sampleRate: 1.0 }  // 100% logging
```

---

## Future Improvements

1. **Dynamic sampling**: Adjust rates based on error rates
2. **Log aggregation**: Group similar logs by time window
3. **Metrics export**: Expose sampling stats to Prometheus
4. **Alerting**: Alert when suppression count exceeds threshold
