# Clerk Backend Integration Summary

## Overview
Migrated from custom JWT authentication to Clerk authentication.

## Files Modified/Created

### 1. Environment Configuration
- **`.env`**: Added `CLERK_SECRET_KEY` and `CLERK_PUBLISHABLE_KEY`
- **`src/config/env.ts`**: Added Clerk environment variable validation

### 2. New Middleware
- **`src/modules/iam/middleware/clerkAuth.ts`** (NEW):
  - `clerkAuthenticate`: Main authentication middleware
  - `clerkOptionalAuth`: Optional authentication
  - `requireRole(role, ...)`: Role-based access control
  - `requireAdmin`: Admin-only routes
  - `requireStaff`: Staff+ routes (admin, super_admin)

### 3. Updated Routes
- **`src/modules/router.ts`**: Replaced `authenticate` with `clerkAuthenticate`
- **`src/modules/auth/routes.ts`**: Updated to use Clerk middleware

### 4. Database
- **`database/migrations/008_add_clerk_auth.sql`**: Adds `clerk_id` column

### 5. Repository
- **`src/modules/iam/repositories/UserRepository.ts`**: Added:
  - `findByClerkId(clerkId)`
  - `updateClerkId(userId, clerkId)`

## Environment Variables Required

```bash
CLERK_SECRET_KEY=sk_test_...
CLERK_PUBLISHABLE_KEY=pk_test_...
```

## Usage Examples

### Protect a Route with Clerk

```typescript
import { Router } from 'express';
import { clerkAuthenticate, requireAdmin } from '../iam/middleware/clerkAuth';

const router = Router();

// Public route
router.get('/public', handler);

// Protected route (any authenticated user)
router.get('/protected', clerkAuthenticate, handler);

// Admin only
router.get('/admin', clerkAuthenticate, requireAdmin, handler);

// Specific roles
router.get('/moderator', clerkAuthenticate, requireRole('admin', 'super_admin'), handler);
```

### Access User in Handler

```typescript
import { Request, Response } from 'express';

const handler = (req: Request, res: Response) => {
  const user = req.user; // Clerk-authenticated user
  
  res.json({
    userId: user.id,
    email: user.email,
    role: user.role,
  });
};
```

## Migration Steps

1. **Run database migration**:
   ```bash
   npm run migrate
   ```

2. **Set environment variables**:
   ```bash
   CLERK_SECRET_KEY=sk_test_...
   CLERK_PUBLISHABLE_KEY=pk_test_...
   ```

3. **Link existing users** (one-time):
   - Users will be automatically linked by email on first login
   - Or run a migration script to set clerk_id for all users

4. **Test endpoints**:
   - Public routes: Should work without token
   - Protected routes: Should return 401 without token
   - With valid Clerk token: Should allow access

## API Changes

| Old Endpoint | New Behavior |
|--------------|--------------|
| `POST /auth/login` | Returns 501 - Use Clerk frontend |
| `POST /auth/register` | Returns 501 - Use Clerk frontend |
| `POST /auth/refresh` | Returns 501 - Handled by Clerk |
| `GET /auth/me` | Requires Clerk JWT |
| All protected routes | Require Clerk JWT in Authorization header |

## Security Considerations

- All JWT verification is now handled by Clerk
- Tokens are verified against Clerk's JWKS
- User lookup is done via `clerk_id` column
- Fallback to email lookup for migration period
- Role-based access control is preserved
