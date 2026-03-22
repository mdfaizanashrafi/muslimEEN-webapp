# Invite Token Debug Analysis Report

## 🔍 Root Cause Candidates (Ranked by Probability)

### 1. 🚨 SECRET MISMATCH (Highest Probability)

**Problem**: Token generated with one secret, verified with different secret.

**Evidence**:
```typescript
// InviteTokenService.ts - Line 19
const TOKEN_SECRET = env.INVITE_TOKEN_SECRET || env.CLERK_SECRET_KEY || 'fallback-secret-change-in-production';
```

**Failure Scenario**:
- Backend A (generating token): Has `INVITE_TOKEN_SECRET=secret-a`
- Backend B (webhook verifying): Has `INVITE_TOKEN_SECRET=secret-b` or falls back to `CLERK_SECRET_KEY`
- **Result**: Signature mismatch → "Invalid token"

**Why This Happens**:
- Different environment variables between API server and webhook worker
- `INVITE_TOKEN_SECRET` set on API but not webhook
- `CLERK_SECRET_KEY` different between environments
- One uses fallback, other doesn't

**Check**:
```bash
# In production, check BOTH environments:
echo $INVITE_TOKEN_SECRET   # Should be identical
echo $CLERK_SECRET_KEY      # Fallback, should also be identical
```

---

### 2. 🚨 TOKEN EXPIRED (High Probability)

**Problem**: User takes longer than 10 minutes to complete signup.

**Evidence**:
```typescript
// InviteTokenService.ts - Line 21
const TOKEN_EXPIRY_MINUTES = 10; // Signed token valid for 10 minutes

// Frontend validation (signup/page.tsx:21)
const TOKEN_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
```

**Flow**:
1. User validates invite → Token generated (expires at +10 min)
2. User fills out signup form → Takes > 10 minutes
3. Webhook receives token → Expiry check fails
4. **Result**: `payload.exp < now` → "Token expired"

**Evidence in Logs**:
```
Token verification error: { error: 'Token expired' }
```

---

### 3. 🚨 ENV VARIABLE NOT SET IN WEBHOOK CONTEXT (Medium Probability)

**Problem**: `INVITE_TOKEN_SECRET` missing in webhook environment.

**Evidence**:
```typescript
// env.ts - Line 119-132
INVITE_TOKEN_SECRET: z
  .string()
  .min(32, 'INVITE_TOKEN_SECRET must be at least 32 characters')
  .optional()  // <-- Marked as optional!
```

**Failure Scenario**:
- API has `INVITE_TOKEN_SECRET` set
- Webhook handler doesn't have it set
- API generates with `INVITE_TOKEN_SECRET`
- Webhook falls back to `CLERK_SECRET_KEY` or `'fallback-secret'`
- **Result**: Different secrets → Signature mismatch

---

### 4. 🚨 CLOCK SKEW (Low-Medium Probability)

**Problem**: Server clocks out of sync between token generation and verification.

**Evidence**:
```typescript
// Token generation (Line 58)
const now = Math.floor(Date.now() / 1000);
const exp = now + (TOKEN_EXPIRY_MINUTES * 60);

// Token verification (Line 131)
const now = Math.floor(Date.now() / 1000);
if (payload.exp < now) { return { valid: false, error: 'Token expired' }; }
```

**Failure Scenario**:
- API server clock: 10:00:00
- Webhook server clock: 10:15:00 (15 min ahead)
- Token generated at 10:00:00, expires 10:10:00
- Webhook checks at 10:15:00 → Sees token as expired
- **Result**: "Token expired"

---

### 5. 🚨 URL ENCODING ISSUE (Low Probability)

**Problem**: Token gets URL-encoded when passed through Clerk metadata.

**Evidence**:
```typescript
// Frontend sends (signup/page.tsx:147)
unsafeMetadata: { inviteToken: inviteToken }

// Webhook receives (ClerkWebhookControllerHardened.ts:74)
const signedToken = data.unsafe_metadata?.inviteToken;
```

**Potential Issue**:
- Token contains characters that get encoded: `+`, `/`, `=`
- `base64url` encoding should prevent this, but worth checking
- If standard base64 used, `+` → `%2B`, `/` → `%2F`
- **Result**: Signature mismatch

---

### 6. 🚨 FALLBACK SECRET MISMATCH (Medium Probability)

**Problem**: Mixed use of fallback secret in different deployments.

**Evidence**:
```typescript
const TOKEN_SECRET = env.INVITE_TOKEN_SECRET || env.CLERK_SECRET_KEY || 'fallback-secret-change-in-production';
```

**Failure Scenario**:
- Dev/Staging: No `INVITE_TOKEN_SECRET`, uses `CLERK_SECRET_KEY`
- Production: Has `INVITE_TOKEN_SECRET` set
- Token generated in staging, tested in production
- **Result**: Completely different secrets

---

## 🔁 Token Flow Trace

| Step | Location | Action | Token State |
|------|----------|--------|-------------|
| 1 | User Input | Enter "MUSLIM-ABC123" | Raw code |
| 2 | `InviteControllerHardened.ts:68` | Calls `validateInvite(sanitizedCode)` | Raw code |
| 3 | `InviteServiceHardened.ts:263` | Calls `generateSignedToken(normalizedCode)` | Raw code |
| 4 | `InviteTokenService.ts:57` | Creates payload: `{code, exp, v}` | Raw code in payload |
| 5 | `InviteTokenService.ts:67-73` | Signs with HMAC-SHA256 | `payload.signature` |
| 6 | `InviteControllerHardened.ts:84` | Returns `result.signedToken` | Signed token string |
| 7 | `frontend/invite/page.tsx:65` | Stores in localStorage | `localStorage.setItem('invite_token', token)` |
| 8 | `frontend/signup/page.tsx:31` | Reads from localStorage | `localStorage.getItem('invite_token')` |
| 9 | `frontend/signup/page.tsx:147` | Passes to Clerk | `unsafeMetadata: { inviteToken: token }` |
| 10 | Clerk | Sends webhook | Token in `data.unsafe_metadata.inviteToken` |
| 11 | `ClerkWebhookControllerHardened.ts:74` | Extracts token | `data.unsafe_metadata?.inviteToken` |
| 12 | `ClerkWebhookControllerHardened.ts:90` | Calls `verifySignedToken(signedToken)` | Signed token string |
| 13 | `InviteTokenService.ts:91` | Parses token, verifies signature | Extracted payload.code |
| 14 | `ClerkWebhookControllerHardened.ts:109` | Looks up invite by code | DB lookup by hash(code) |

---

## 🔐 Secret Usage Analysis

### Secret Resolution Chain
```
1. env.INVITE_TOKEN_SECRET (primary)
2. env.CLERK_SECRET_KEY (fallback 1)
3. 'fallback-secret-change-in-production' (fallback 2 - DANGEROUS!)
```

### Where Secrets Are Used

| File | Function | Line | Secret Source |
|------|----------|------|---------------|
| `InviteTokenService.ts` | Module load | 19 | `TOKEN_SECRET` constant |
| `InviteTokenService.ts` | `generateSignedToken` | 69 | Same `TOKEN_SECRET` |
| `InviteTokenService.ts` | `verifySignedToken` | 103 | Same `TOKEN_SECRET` |
| `InviteTokenService.ts` | `hashInviteCode` | 177 | Same `TOKEN_SECRET` |

### ⚠️ CRITICAL: Module-Level Constant
```typescript
// Line 19: Evaluated ONCE at module load
const TOKEN_SECRET = env.INVITE_TOKEN_SECRET || env.CLERK_SECRET_KEY || 'fallback-secret';
```

**Risk**: If env vars change at runtime, `TOKEN_SECRET` remains cached with old value.

---

## 🧪 Payload Comparison

### Generate Payload (Line 61-65)
```typescript
const payload: TokenPayload = {
  code: inviteCode,     // "MUSLIM-ABC123" (raw, uppercase)
  exp: 1708473600,      // Unix timestamp (seconds)
  v: 'v1',              // Version string
};
```

### Verify Payload (Line 118-123)
```typescript
payload = JSON.parse(Buffer.from(payloadBase64, 'base64url').toString());
// Expected: { code: "MUSLIM-ABC123", exp: 1708473600, v: "v1" }
```

### Version Check (Line 126-128)
```typescript
if (payload.v !== TOKEN_VERSION) {  // TOKEN_VERSION = 'v1'
  return { valid: false, error: 'Invalid token version' };
}
```

---

## ⚠️ Risk Points

### Risk 1: Environment Variable Drift
- **Location**: Between API and Webhook environments
- **Impact**: Complete token failure
- **Mitigation**: Ensure `INVITE_TOKEN_SECRET` identical everywhere

### Risk 2: Short Token Expiry
- **Location**: `TOKEN_EXPIRY_MINUTES = 10`
- **Impact**: User frustration if signup takes > 10 min
- **Mitigation**: Increase to 30 minutes or add refresh mechanism

### Risk 3: Unsafe Fallback Secret
- **Location**: `'fallback-secret-change-in-production'`
- **Impact**: Security vulnerability if env not set
- **Mitigation**: Remove fallback, require explicit secret

### Risk 4: No Debug Logging
- **Location**: `verifySignedToken` returns generic errors
- **Impact**: Hard to diagnose failures
- **Mitigation**: Add detailed logging (without exposing secrets)

### Risk 5: Clock Skew
- **Location**: Expiry check uses local `Date.now()`
- **Impact**: False positives in distributed systems
- **Mitigation**: Use NTP, add clock skew tolerance (±2 min)

---

## 🧠 Final Diagnosis

### Most Likely Root Cause: **SECRET MISMATCH**

**Confidence**: 85%

**Reasoning**:
1. Both generation and verification use the SAME code path (`InviteTokenService.ts`)
2. Same algorithm, same encoding, same payload structure
3. The ONLY variable is the `TOKEN_SECRET` environment variable
4. Webhook and API likely running in different environments/contexts

**Supporting Evidence**:
- Token format is correct (passes format check with `.` delimiter)
- Version check would fail with specific error (not happening)
- Expiry would log "Token expired" (check logs for this)
- Generic "Invalid token" suggests signature verification failure

### Second Most Likely: **TOKEN EXPIRED**

**Confidence**: 10%

**Reasoning**:
- 10-minute expiry is short for signup flow
- Users may get distracted during signup
- Log would show "Token expired" specifically

### Third Most Likely: **ENV NOT SET IN WEBHOOK**

**Confidence**: 5%

**Reasoning**:
- `INVITE_TOKEN_SECRET` is optional in schema
- Webhook may not have access to same env vars
- Fallback to `CLERK_SECRET_KEY` or default would cause mismatch

---

## 🔍 Diagnostic Commands

### Check Environment Variables
```bash
# On API server
echo "INVITE_TOKEN_SECRET=$INVITE_TOKEN_SECRET"
echo "CLERK_SECRET_KEY=$CLERK_SECRET_KEY"

# On Webhook server (same check)
echo "INVITE_TOKEN_SECRET=$INVITE_TOKEN_SECRET"
echo "CLERK_SECRET_KEY=$CLERK_SECRET_KEY"

# Compare - they MUST be identical
```

### Debug Token Manually
```typescript
// Add temporary debug logging to verifySignedToken
console.log('Token:', token);
console.log('Parts:', parts);
console.log('Payload:', payload);
console.log('Expected sig:', expectedSignature);
console.log('Provided sig:', providedSignature);
console.log('TOKEN_SECRET length:', TOKEN_SECRET.length);
```

### Check Logs for Specific Error
```bash
# Look for these specific error messages:
grep "Token expired" /var/log/app.log
grep "Invalid token version" /var/log/app.log
grep "Invalid token format" /var/log/app.log
grep "Invalid token payload" /var/log/app.log
grep "Invalid token" /var/log/app.log  # Generic = signature mismatch
```

---

## ✅ Recommended Immediate Actions

1. **Verify ENV vars are identical** between API and webhook environments
2. **Add debug logging** to `verifySignedToken` to see exact failure reason
3. **Check if `INVITE_TOKEN_SECRET`** is set in webhook environment
4. **Consider increasing expiry** from 10 to 30 minutes
5. **Remove fallback secret** to force explicit configuration
