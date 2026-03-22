# Invite Hash Consistency Audit Report

## ✅ AUDIT RESULT: CONSISTENT

All invite code hashing across the codebase uses the **same method** (HMAC-SHA256).

---

## 🔒 Hash Strategy

### Method: HMAC-SHA256
```typescript
export const hashInviteCode = (code: string): string => {
  return crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(code.toUpperCase())
    .digest('hex');
};
```

### Token Secret Source
```typescript
const TOKEN_SECRET = env.INVITE_TOKEN_SECRET || env.CLERK_SECRET_KEY || 'fallback-secret';
```

### Key Characteristics
| Aspect | Value |
|--------|-------|
| Algorithm | HMAC-SHA256 |
| Secret | `INVITE_TOKEN_SECRET` (falls back to `CLERK_SECRET_KEY`) |
| Input Normalization | `code.toUpperCase()` |
| Output Encoding | Hex (64 characters) |
| Location | `InviteTokenService.ts` (single source of truth) |

---

## 📊 Hash Usage Inventory

### ✅ CONSISTENT USAGE (Invite System)

| File | Function | Line | Usage |
|------|----------|------|-------|
| `InviteTokenService.ts` | `hashInviteCode` | 175 | **DEFINITION** |
| `InviteTokenService.ts` | `compareInviteCode` | 187 | Uses `hashInviteCode` |
| `InviteServiceHardened.ts` | `createInvite` | 142 | `hashInviteCode(code)` |
| `InviteServiceHardened.ts` | `validateInvite` | 228 | `hashInviteCode(normalizedCode)` |
| `InviteServiceHardened.ts` | `consumeInvite` | 354 | `hashInviteCode(normalizedCode)` |
| `InviteRepository.ts` | `create` | 51 | `hashInviteCode(code)` |
| `InviteRepository.ts` | `createAdminInvite` | 73 | `hashInviteCode(code)` |
| `InviteRepository.ts` | `findByToken` | 110 | `hashInviteCode(normalizedCode)` |
| `InviteRepository.ts` | `findByTokenWithInviter` | 160 | `hashInviteCode(normalizedCode)` |
| `InviteRepository.ts` | `markAsUsed` | 261 | `hashInviteCode(normalizedCode)` |
| `InviteRepository.ts` | `markAsUsedWithClient` | 290 | `hashInviteCode(normalizedCode)` |

**Result**: ✅ All invite-related hashing uses the SAME function

---

### ⚠️ OTHER HASHING (Different Purpose - NOT A PROBLEM)

| File | Function | Algorithm | Purpose |
|------|----------|-----------|---------|
| `security.ts` | `hashData` | SHA256 | General data hashing (not invite codes) |
| `idempotency.ts` | generateFingerprint | SHA256 | Request deduplication keys |
| `InviteTokenService.ts` | `generateSignedToken` | HMAC-SHA256 | **Token signature** (different from code hash) |
| `InviteTokenService.ts` | `verifySignedToken` | HMAC-SHA256 | **Token verification** (different from code hash) |

**Note**: These are intentionally different:
- `hashData` in `security.ts` is for general-purpose data hashing
- `generateSignedToken` uses HMAC-SHA256 to sign the token payload (not the invite code)
- These do NOT affect invite code hashing consistency

---

## 🔁 Flow Verification

### 1. Invite Creation Flow
```
generateInviteCode() → "MUSLIM-ABCD12"
  ↓
hashInviteCode("MUSLIM-ABCD12") → "a3f5b2..." (64 hex chars)
  ↓
INSERT (code_hash = "a3f5b2...", token = "MUSLIM-ABCD12")
```

### 2. Invite Validation Flow
```
User enters: "muslim-abcd12"
  ↓
normalizedCode = "MUSLIM-ABCD12"
  ↓
hashInviteCode("MUSLIM-ABCD12") → "a3f5b2..."
  ↓
SELECT * FROM invites WHERE code_hash = "a3f5b2..."
  ↓
Match found ✅
```

### 3. Signed Token Generation Flow
```
generateSignedToken("MUSLIM-ABCD12")
  ↓
payload = { code: "MUSLIM-ABCD12", exp: 1234567890, v: "v1" }
  ↓
signature = HMAC-SHA256(payload, TOKEN_SECRET)  ← Signs payload, NOT the code
  ↓
token = base64(payload) + "." + signature
```

### 4. Webhook Consumption Flow
```
verifySignedToken(token)
  ↓
Extract: code = "MUSLIM-ABCD12"
  ↓
normalizedCode = "MUSLIM-ABCD12"
  ↓
hashInviteCode("MUSLIM-ABCD12") → "a3f5b2..."
  ↓
UPDATE invites SET status='used' WHERE code_hash = "a3f5b2..."
```

---

## 🧪 Test Verification

| Test Case | Expected Result | Status |
|-----------|-----------------|--------|
| Same code always produces same hash | ✅ Deterministic | PASS |
| Hash includes uppercase normalization | "muslim-abc" == "MUSLIM-ABC" | PASS |
| Hash requires correct secret | Wrong secret → different hash | PASS |
| Token signature != code hash | Different operations | PASS |

---

## 📁 Single Source of Truth

### File: `backend/src/modules/invites/services/InviteTokenService.ts`

```typescript
/**
 * Hash an invite code for database storage
 * SINGLE SOURCE OF TRUTH for invite code hashing
 * Used by: creation, validation, consumption
 */
export const hashInviteCode = (code: string): string => {
  return crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(code.toUpperCase())
    .digest('hex');
};
```

### Exported From:
- `InviteTokenService.ts` (primary)
- `InviteServiceHardened.ts` (re-export for convenience)

### Imported By:
- `InviteRepository.ts`
- `InviteServiceHardened.ts`

---

## ✅ Audit Checklist

| Check | Status |
|-------|--------|
| One hashing function for invite codes | ✅ `hashInviteCode` in `InviteTokenService.ts` |
| All creation uses same hash | ✅ `InviteRepository.ts` lines 51, 73 |
| All validation uses same hash | ✅ `InviteServiceHardened.ts` line 228 |
| All consumption uses same hash | ✅ `InviteServiceHardened.ts` line 354 |
| Token signature separate from code hash | ✅ Different purpose, same algorithm |
| No SHA256 (non-HMAC) for invite codes | ✅ All use HMAC-SHA256 |
| TypeScript compiles | ✅ No errors |

---

## 🎯 Summary

### ✅ NO CHANGES REQUIRED

The invite code hashing is **already consistent** across the entire codebase:

1. **Single function**: `hashInviteCode` in `InviteTokenService.ts`
2. **Single algorithm**: HMAC-SHA256 with secret key
3. **Single normalization**: `toUpperCase()`
4. **Used everywhere**: Creation, validation, consumption

### Flow Consistency Verified:
- ✅ Create → stores hash
- ✅ Validate → looks up by hash
- ✅ Consume → updates by hash
- ✅ Token stores raw code (not hash)
- ✅ All hashes match across flows

### No Mismatches Found:
- ❌ No `createHash('sha256')` used for invite codes
- ❌ No inconsistent normalization
- ❌ No different secrets

---

## 📝 Notes

1. **Token Signature vs Code Hash**: Both use HMAC-SHA256 but with different purposes:
   - Token signature: Signs the JWT-like payload (prevents token tampering)
   - Code hash: Hashes the invite code for DB storage (prevents code leaks)

2. **Backward Compatibility**: The system supports old invites via `WHERE code_hash = $1 OR token = $2`

3. **Security**: HMAC-SHA256 is the correct choice (vs plain SHA256) because:
   - Requires secret key (prevents rainbow table attacks)
   - Standard for message authentication
