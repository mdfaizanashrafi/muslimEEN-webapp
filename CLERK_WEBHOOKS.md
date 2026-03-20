# Clerk Webhooks Implementation

**DATE**: 2026-03-20  
**STATUS**: ✅ Complete  
**ENDPOINT**: `POST /api/webhooks/clerk`

---

## Overview

Webhooks keep the backend database in sync with Clerk user lifecycle events. They also enforce **invite-only signup** by deleting users who register without valid invites.

---

## Endpoint

```
POST /api/webhooks/clerk
Content-Type: application/json
Svix-Id: <id>
Svix-Timestamp: <timestamp>
Svix-Signature: <signature>
```

**Authentication**: Svix signature verification using `CLERK_WEBHOOK_SECRET`

---

## Event Handlers

### 1. `user.created`

**Purpose**: Creates user in database, enforces invite-only policy

**Flow**:
```
1. Extract invite code from unsafe_metadata
2. If NO invite code → Delete Clerk user → Return error
3. Validate invite code
4. If INVALID invite → Delete Clerk user → Return error
5. Check email matches (if pre-assigned)
6. Create user in database
7. Link clerk_id to user record
8. Mark invite as used
9. Update last login
```

**Code**: `backend/src/modules/iam/controllers/ClerkWebhookController.ts:47`

### 2. `user.updated`

**Purpose**: Syncs user profile changes from Clerk to database

**Syncs**:
- Email address
- First name
- Last name

**Code**: `backend/src/modules/iam/controllers/ClerkWebhookController.ts:165`

### 3. `user.deleted`

**Purpose**: Handles user deletion from Clerk

**Action**: Soft delete - marks user as `deleted` role (not hard delete for audit)

**Code**: `backend/src/modules/iam/controllers/ClerkWebhookController.ts:193`

### 4. `session.created`

**Purpose**: Updates last login timestamp

**Code**: `backend/src/modules/iam/controllers/ClerkWebhookController.ts:217`

---

## Security

### Signature Verification

```typescript
const verifyWebhook = (payload: string, headers: any): any => {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  const wh = new Webhook(webhookSecret);
  return wh.verify(payload, headers);
};
```

### Invalid Signature Response

```http
HTTP/1.1 401 Unauthorized
{ "error": "Invalid webhook signature" }
```

### Invite Enforcement

If a user is created without a valid invite:

1. User is deleted from Clerk
2. Error is logged
3. Webhook returns 200 (prevents Clerk retries)

```typescript
await deleteClerkUser(clerkId);
throw new Error('INVITE_REQUIRED: Signup without invite code is not allowed');
```

---

## User Mapping

### Database Schema

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  clerk_id VARCHAR(255) UNIQUE,  -- Links to Clerk user
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(50) DEFAULT 'muslim_unverified',
  verification_tier VARCHAR(50) DEFAULT 'basic',
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Mapping Logic

| Clerk Field | Database Field |
|-------------|----------------|
| `id` | `clerk_id` |
| `email_addresses[0]` | `email` |
| `first_name` | `first_name` |
| `last_name` | `last_name` |
| `public_metadata.role` | `role` |

---

## Configuration

### Environment Variables

```bash
# Backend .env
CLERK_SECRET_KEY=sk_test_...
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_WEBHOOK_SECRET=whsec_...  # Required for webhook verification
```

### Clerk Dashboard Setup

1. Go to **Webhooks** in Clerk Dashboard
2. Add endpoint: `https://your-api.com/api/webhooks/clerk`
3. Select events:
   - `user.created`
   - `user.updated`
   - `user.deleted`
   - `session.created`
4. Copy **Signing Secret** to `CLERK_WEBHOOK_SECRET`

---

## Testing

### Test Webhook Locally

```bash
# Install ngrok
npx ngrok http 3001

# Set webhook URL in Clerk Dashboard
# https://xxxx.ngrok.io/api/webhooks/clerk
```

### Test Events

```bash
# Create a user (triggers user.created)
curl -X POST https://api.clerk.com/v1/users \
  -H "Authorization: Bearer $CLERK_SECRET_KEY" \
  -d '{"email_address": ["test@example.com"], "password": "test1234"}'

# Update a user (triggers user.updated)
curl -X PATCH https://api.clerk.com/v1/users/{user_id} \
  -H "Authorization: Bearer $CLERK_SECRET_KEY" \
  -d '{"first_name": "Updated"}'

# Delete a user (triggers user.deleted)
curl -X DELETE https://api.clerk.com/v1/users/{user_id} \
  -H "Authorization: Bearer $CLERK_SECRET_KEY"
```

---

## Response Examples

### Success

```json
{
  "success": true,
  "message": "Processed user.created"
}
```

### Validation Error (Invite Required)

```json
{
  "success": false,
  "error": "INVITE_REQUIRED: Signup without invite code is not allowed"
}
```

### Server Error

```json
{
  "success": false,
  "error": "Internal server error"
}
```

---

## Error Handling

| Error Type | Action | HTTP Status |
|------------|--------|-------------|
| Invalid signature | Reject request | 401 |
| Invite required | Delete user, log error | 200 |
| Invalid invite | Delete user, log error | 200 |
| Email mismatch | Delete user, log error | 200 |
| DB error | Delete user, log error | 500 |

**Note**: Validation errors return 200 to prevent Clerk retries.

---

## File Structure

```
backend/src/
├── modules/
│   ├── iam/
│   │   └── controllers/
│   │       └── ClerkWebhookController.ts  # Main webhook handler
│   ├── invites/
│   │   └── services/
│   │       └── InviteService.ts           # Invite validation
│   └── shared/
│       └── middleware/
│           └── bodyParser.ts              # Raw body parser
├── modules/router.ts                       # Route registration
└── server.ts                              # Server setup
```

---

## Related Files

| File | Purpose |
|------|---------|
| `backend/src/modules/iam/controllers/ClerkWebhookController.ts` | Webhook handler |
| `backend/src/modules/router.ts` | Route registration |
| `backend/src/modules/shared/middleware/bodyParser.ts` | Raw body parser |
| `backend/src/modules/invites/services/InviteService.ts` | Invite validation |
| `backend/src/modules/iam/repositories/UserRepository.ts` | User DB operations |

---

## Success Criteria Checklist

- [x] Webhook endpoint at `/api/webhooks/clerk`
- [x] Signature verification with `CLERK_WEBHOOK_SECRET`
- [x] `user.created` handler with invite validation
- [x] `user.updated` handler for profile sync
- [x] `user.deleted` handler for soft delete
- [x] `session.created` handler for last login
- [x] Invalid users are removed (deleted from Clerk)
- [x] `clerk_id` stored in database
- [x] No duplicate users (checked via clerk_id)
- [x] Returns appropriate HTTP status codes

---

## Troubleshooting

### Webhook not receiving events

1. Check webhook URL is correct in Clerk Dashboard
2. Verify `CLERK_WEBHOOK_SECRET` is set
3. Check backend logs for signature verification errors
4. Ensure endpoint is publicly accessible (no firewall blocking)

### Users not created in database

1. Check invite code is being passed in `unsafe_metadata`
2. Verify invite code is valid and not used
3. Check database connection
4. Review webhook logs for errors

### Duplicate users

1. Check `clerk_id` is being set correctly
2. Verify `findByClerkId` query works
3. Check for race conditions in user creation
