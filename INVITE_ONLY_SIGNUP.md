# Invite-Only Signup Implementation

**DATE**: 2026-03-20  
**STATUS**: ✅ Implemented  
**PRIORITY**: Security-Critical

---

## Overview

MuslimEEN is an **invitation-only network**. Users cannot sign up without a valid invite code. This document describes the implementation of invite-only signup with Clerk authentication.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           SIGNUP FLOW                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────┐     ┌──────────────┐     ┌──────────────┐                │
│  │  User    │────▶│   Validate   │────▶│  Clerk       │                │
│  │ Enters   │     │   Invite     │     │  Signup      │                │
│  │ Invite   │     │   (Backend)  │     │              │                │
│  └──────────┘     └──────────────┘     └──────────────┘                │
│                                              │                          │
│                                              ▼                          │
│                                       ┌──────────────┐                 │
│                                       │  Webhook     │                 │
│                                       │  user.created│                 │
│                                       └──────────────┘                 │
│                                              │                          │
│                                              ▼                          │
│                                       ┌──────────────┐                 │
│                                       │   Backend    │                 │
│                                       │   Enforces   │                 │
│                                       │   Invite     │                 │
│                                       └──────────────┘                 │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Components

### 1. Frontend: `/register` Page

**Location**: `frontend/app/register/page.tsx`

**Features**:
- 3-step signup flow:
  1. **Invite Validation**: User enters invite code, validated against backend
  2. **Account Creation**: User enters email/password/name, Clerk creates account
  3. **Email Verification**: If required by Clerk settings

**Security**:
- Invite code must be validated before showing registration form
- Pre-assigned emails are locked (can't be changed)
- Invite code passed in `unsafeMetadata` for backend verification

**Key Code**:
```typescript
// Validate invite before allowing signup
const validateInvite = async () => {
  const response = await invites.validateInvite(inviteCode);
  if (response.success && response.valid) {
    setIsInviteValid(true);
    // Pre-fill email if invite has pre-assigned email
    if (response.email) setEmail(response.email);
  }
};

// Signup with Clerk (includes invite code in metadata)
const result = await signUp.signUp?.create({
  emailAddress: email,
  password,
  firstName,
  lastName,
  unsafeMetadata: {
    inviteCode: inviteCode.toUpperCase(),
    source: 'invite_only_signup',
  },
});
```

---

### 2. Backend: Invite Validation API

**Location**: `backend/src/modules/invites/controllers/InviteController.ts`

**Endpoint**: `GET /api/invites/validate/:token`

**Response**:
```json
// Success
{
  "success": true,
  "valid": true,
  "invite": {
    "id": "uuid",
    "inviterName": "John Doe",
    "expiresAt": "2024-12-31T23:59:59Z"
  },
  "email": "user@example.com"  // Only if pre-assigned
}

// Failure
{
  "success": false,
  "valid": false,
  "message": "Invalid or expired invite code"
}
```

---

### 3. Backend: Clerk Webhook Handler

**Location**: `backend/src/modules/iam/controllers/ClerkWebhookController.ts`

**Endpoint**: `POST /webhooks/clerk`

**Purpose**: Receives Clerk events and enforces invite-only signup at the backend

**Critical Logic**:
```typescript
const handleUserCreated = async (evt) => {
  const clerkId = evt.data.id;
  const inviteCode = evt.data.unsafe_metadata?.inviteCode;
  
  // CRITICAL: No invite code = delete user
  if (!inviteCode) {
    await deleteClerkUser(clerkId);
    throw new Error('INVITE_REQUIRED: Signup without invite code is not allowed');
  }
  
  // Validate invite again (backend enforcement)
  const validation = await InviteService.validateInvite(inviteCode);
  if (!validation.valid) {
    await deleteClerkUser(clerkId);
    throw new Error(`INVALID_INVITE: ${validation.message}`);
  }
  
  // Create user in our database
  const newUser = await UserRepository.create({...});
  await UserRepository.updateClerkId(newUser.id, clerkId);
  
  // Mark invite as used
  await InviteService.useInvite({
    token: inviteCode,
    userId: newUser.id,
    userEmail: primaryEmail,
  });
};
```

**Security Notes**:
- Webhook signature verified using `svix`
- Deletes Clerk users who signup without valid invites
- Double-validates invites (frontend + backend)
- Enforces email matching if invite has pre-assigned email

---

### 4. Backend: Webhook Route

**Location**: `backend/src/routes/webhooks.ts`

```typescript
router.post(
  '/clerk',
  bodyParser.raw({ type: 'application/json' }),  // Raw body for signature verification
  handleClerkWebhook
);
```

---

## Security Enforcement

### Defense in Depth

| Layer | Enforcement | Failure Action |
|-------|-------------|----------------|
| Frontend | Requires valid invite before showing form | Blocks UI |
| Backend API | Validates invite token | Returns 400 error |
| Clerk Webhook | Validates invite on user creation | **Deletes user** |
| Database | Invite marked as used | Prevents reuse |

### Critical Points

1. **Frontend Validation**: UX layer, prevents accidental submissions
2. **Backend API Validation**: Prevents direct API calls without invite
3. **Webhook Enforcement**: **CRITICAL** - This is the actual security barrier
   - Even if someone bypasses frontend and API validation
   - Webhook will delete the Clerk user if invite is invalid
   - This is the "last line of defense"

---

## Environment Variables

### Frontend (.env.local)
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/register
```

### Backend (.env)
```bash
CLERK_SECRET_KEY=sk_test_...
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_WEBHOOK_SECRET=whsec_...  # Required for webhook verification
```

---

## Clerk Dashboard Configuration

### Required Webhook Events

In Clerk Dashboard, configure webhook to send these events:

- `user.created` - Triggers user creation in our DB, enforces invite
- `user.updated` - Syncs user profile changes
- `user.deleted` - Marks user as deleted in our DB
- `session.created` - Updates last login timestamp

### Webhook Endpoint URL

```
Production: https://api.muslimeen.org/api/webhooks/clerk
Staging:    https://staging-api.muslimeen.org/api/webhooks/clerk
Local Dev:  https://ngrok-url.ngrok.io/api/webhooks/clerk  (use ngrok for local testing)
```

---

## Testing the Flow

### 1. Create an Invite

```bash
# Login as admin, then:
POST /api/invites
{ "email": "test@example.com" }  # Optional: pre-assign email

# Response:
{
  "success": true,
  "invite": {
    "token": "ABC123XYZ",
    "inviteLink": "https://muslimeen.org/register?invite_token=ABC123XYZ"
  }
}
```

### 2. Test Valid Invite Flow

1. Go to `/register`
2. Enter invite code: `ABC123XYZ`
3. Click "Validate" - should show success
4. Complete registration form
5. Account created successfully
6. Invite marked as "used" in database

### 3. Test Invalid Invite Blocking

1. Go to `/register`
2. Enter invalid invite code: `INVALID123`
3. Click "Validate" - should show error
4. Cannot proceed to registration form

### 4. Test Backend Enforcement (Direct API)

```bash
# Try to create Clerk user without invite (will fail at webhook)
curl -X POST https://api.clerk.com/v1/users \
  -H "Authorization: Bearer sk_test_..." \
  -H "Content-Type: application/json" \
  -d '{
    "email_address": ["hacker@example.com"],
    "password": "password123"
  }'

# Result: User created in Clerk, then immediately deleted by webhook
```

---

## Database Schema

### Invites Table

```sql
CREATE TABLE invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token VARCHAR(64) UNIQUE NOT NULL,
  created_by UUID REFERENCES users(id),
  invitee_email VARCHAR(255),  -- Optional: pre-assigned email
  used_by UUID REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'pending',  -- pending, used, expired, revoked
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  used_at TIMESTAMP
);
```

---

## Error Handling

### Frontend Errors

| Error | Message |
|-------|---------|
| Invalid format | "Please enter a valid invite code (at least 8 characters)" |
| Invalid token | "Invalid or expired invite code" |
| Already used | "This invite has already been used" |
| Expired | "This invite has expired" |
| Revoked | "This invite has been revoked" |

### Backend Errors

| Error | HTTP Status | Action |
|-------|-------------|--------|
| INVALID_INVITE | 400 (webhook: 200) | Delete Clerk user |
| INVITE_REQUIRED | 400 (webhook: 200) | Delete Clerk user |
| EMAIL_MISMATCH | 400 (webhook: 200) | Delete Clerk user |

---

## Future Enhancements

- [ ] Rate limiting on invite validation endpoint
- [ ] Invite request form for users without invites
- [ ] Admin approval workflow for invite requests
- [ ] Bulk invite generation for institutions
- [ ] Invite analytics dashboard

---

## Security Checklist

- [x] Frontend validates invite before showing form
- [x] Backend API validates invite tokens
- [x] Webhook verifies invite on user creation
- [x] Webhook deletes users without valid invites
- [x] Webhook signature verification enabled
- [x] Invite codes are single-use
- [x] Expired invites are rejected
- [x] Revoked invites are rejected
- [x] Pre-assigned emails are enforced
- [ ] Rate limiting on validation endpoint (TODO)
- [ ] IP-based abuse detection (TODO)

---

## Related Files

| File | Purpose |
|------|---------|
| `frontend/app/register/page.tsx` | Registration page with invite validation |
| `backend/src/modules/iam/controllers/ClerkWebhookController.ts` | Webhook handler enforcing invite-only signup |
| `backend/src/routes/webhooks.ts` | Webhook routes |
| `backend/src/modules/invites/controllers/InviteController.ts` | Invite validation API |
| `backend/src/modules/invites/services/InviteService.ts` | Invite business logic |
| `frontend/lib/api.ts` | Frontend API client |

---

## Support

For issues with invite-only signup:

1. Check Clerk webhook logs in Dashboard
2. Verify `CLERK_WEBHOOK_SECRET` is set correctly
3. Check backend logs for webhook processing errors
4. Verify invite token exists and is valid in database
