# Invite Validation → Redirect Flow Analysis

## 🔍 FLOW TRACE

### Step 1: Invite Validation (frontend/app/invite/page.tsx)

```typescript
// Lines 63-69
if (result.success && result.valid && result.signedToken) {
  // Store SIGNED TOKEN (not raw code)
  localStorage.setItem('invite_token', result.signedToken);      // ✅ STORED
  localStorage.setItem('invite_validated_at', Date.now().toString()); // ✅ STORED
  
  // Redirect to signup
  router.push('/signup');                                         // ✅ REDIRECT
}
```

**Summary**:
- ✅ Token stored in localStorage BEFORE redirect
- ✅ Redirect to `/signup` (not `/login`)
- ⚠️ Line 226 has Link to `/login` (for existing users)

---

### Step 2: Middleware Check (frontend/middleware.ts)

```typescript
// Lines 12-20: Public routes
const isPublicRoute = createRouteMatcher([
  "/",
  "/login",           // ✅ Public
  "/register",        // ✅ Public
  "/about",
  "/blog",
  "/blog/(.*)",
  "/api/webhook/clerk",
]);

// Lines 22-27: Protection logic
export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();  // ← BLOCKS non-public routes
  }
});
```

**CRITICAL FINDING**: `/invite` and `/signup` are NOT in public routes list!

---

### Step 3: Signup Page Load (frontend/app/signup/page.tsx)

```typescript
// Lines 29-52
useEffect(() => {
  const token = localStorage.getItem('invite_token');
  const validatedAt = localStorage.getItem('invite_validated_at');

  if (!token) {
    router.replace('/invite');  // ← Redirect back if no token
    return;
  }
  // ...
}, [router]);
```

**Summary**:
- ✅ Reads from localStorage
- ✅ Redirects back to `/invite` if no token

---

## 🚨 CRITICAL ISSUE IDENTIFIED

### The Problem

| Route | In Public List? | Result |
|-------|-----------------|--------|
| `/invite` | ❌ NO | Blocked by Clerk middleware |
| `/signup` | ❌ NO | Blocked by Clerk middleware |
| `/login` | ✅ YES | Accessible |
| `/register` | ✅ YES | Accessible |

**What Happens**:
1. User enters invite code on `/invite`
2. Validation succeeds, token stored in localStorage
3. `router.push('/signup')` called
4. **MIDDLEWARE INTERCEPTS**: `/signup` is not public
5. Clerk `auth.protect()` triggers
6. User redirected to **sign-in page** (not signup!)
7. Token is in localStorage but user can't complete signup

---

## 📊 Expected vs Actual Flow

### Expected Flow
```
/invite → validate → store token → /signup → Clerk SignUp → Webhook → Success
```

### Actual Flow (Current)
```
/invite → validate → store token → /signup → [MIDDLEWARE BLOCK] → /login → User stuck!
```

---

## 🔍 Evidence

### File 1: Invite Page Redirect
```typescript
// frontend/app/invite/page.tsx:69
router.push('/signup');  // ← Correct target
```

### File 2: Middleware Blocks
```typescript
// frontend/middleware.ts:12-20
const isPublicRoute = createRouteMatcher([
  "/",
  "/login",
  "/register",     // ← /signup NOT listed
  "/about",
  "/blog",
  "/blog/(.*)",
  "/api/webhook/clerk",
  // MISSING: "/invite", "/signup"
]);
```

### File 3: Signup Page Token Read
```typescript
// frontend/app/signup/page.tsx:31
const token = localStorage.getItem('invite_token');  // ← Reads correctly
```

---

## ✅ Token Storage Verification

| Step | Location | Status |
|------|----------|--------|
| Store | invite/page.tsx:65-66 | ✅ STORED BEFORE REDIRECT |
| Read | signup/page.tsx:31 | ✅ READS CORRECTLY |
| Expiry Check | signup/page.tsx:42-48 | ✅ 10 minute window |

**Token is NOT lost** - it's stored correctly. The issue is middleware blocking access.

---

## 🎯 Root Cause

**The middleware configuration is missing `/invite` and `/signup` from the public routes list.**

This causes Clerk to protect these routes, redirecting unauthenticated users to the sign-in page instead of allowing them to complete the invite flow.

---

## 📋 Summary

| Aspect | Finding |
|--------|---------|
| **Redirect Path** | `/signup` (correct) |
| **Code Location** | `invite/page.tsx:69` |
| **Token Storage** | ✅ Stored before redirect |
| **Token Read** | ✅ Read correctly in signup |
| **Flow Broken** | ❌ YES (by middleware) |
| **Issue Type** | Missing public routes in middleware |

---

## 🔧 Required Fix (For Reference Only)

Add to `frontend/middleware.ts`:

```typescript
const isPublicRoute = createRouteMatcher([
  "/",
  "/login",
  "/register",
  "/invite",      // ← ADD THIS
  "/signup",      // ← ADD THIS
  "/about",
  "/blog",
  "/blog/(.*)",
  "/api/webhook/clerk",
]);
```

**NOTE**: This is documentation only - no changes should be made per instructions.
