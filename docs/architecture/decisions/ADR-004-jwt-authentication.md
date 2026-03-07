# ADR-004: JWT Authentication

## Status
- **Accepted**

## Context

MuslimEEN requires a secure authentication system with the following requirements:

1. **Trust-Based Access**: Different verification tiers (unverified, biometric, two-witness, business, institutional) have different access levels
2. **Invitation-Only Platform**: Users must have a valid invitation to register, linking their account to an inviter
3. **Session Management**: Users should remain logged in across sessions with a reasonable timeout
4. **API Security**: All API endpoints (except public ones) must verify authentication
5. **Cross-Platform**: The same authentication mechanism should work for web and future mobile applications
6. **Shariah Compliance**: No tracking or advertising-related session handling that would violate privacy principles
7. **Transparency**: Authentication flows should be auditable and understandable

The platform handles sensitive operations including:
- Financial transactions (Qard Hasan, Sadaqah, Waqf)
- Trust score calculations affecting user reputation
- Witness attestations for identity verification
- Marketplace transactions

## Decision

We will use **JSON Web Tokens (JWT)** for stateless authentication with the following implementation:

### JWT Service Implementation

```typescript
// backend/src/modules/iam/services/JwtService.ts
import jwt from 'jsonwebtoken';
import { JWTPayload } from '../../../types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] 
  });
};

export const verifyToken = (token: string): JWTPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
};
```

### Token Payload Structure

```typescript
// backend/src/types/index.ts
export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  verificationTier: VerificationTier;
  trustScore: number;
  iat: number;  // Issued at
  exp: number;  // Expiration
}
```

### Authentication Middleware

```typescript
// backend/src/modules/shared/middleware/auth.ts
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }
  
  const token = authHeader.substring(7);
  const payload = verifyToken(token);
  
  if (!payload) {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }
  
  // Attach user info to request
  req.user = payload;
  next();
};
```

### Role-Based Access Control

```typescript
export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    
    next();
  };
};

// Usage
router.post('/qard-hasan', 
  authenticate, 
  requireRole('muslim_verified', 'admin'),
  createQardHasanHandler
);
```

### Security Measures

1. **Secret Management**: JWT_SECRET must be:
   - Minimum 32 characters
   - Stored in environment variables (never committed)
   - Rotated periodically in production

2. **Token Expiration**: Default 24-hour expiration balances security and user experience

3. **HTTPS Only**: Tokens are transmitted only over HTTPS in production

4. **Token Refresh**: Not implemented initially; users re-authenticate after expiration. Can be added later with refresh tokens.

5. **Rate Limiting**: Authentication endpoints have strict rate limiting (5 attempts per minute):
```typescript
// backend/src/middleware/rateLimiter.ts
export const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: 'Too many authentication attempts'
});
```

## Consequences

### Positive

1. **Stateless Authentication**: No server-side session storage required. The backend can scale horizontally without shared session state.

2. **Cross-Platform Compatibility**: JWTs work identically for web SPA, mobile apps, and third-party API integrations.

3. **Self-Contained Claims**: Token includes user role and verification tier, eliminating database lookups for authorization checks on every request.

4. **Performance**: No database query required to validate tokens (though user existence checks may still be performed for critical operations).

5. **Transparency**: JWT payload is base64-encoded (not encrypted), allowing users to inspect their own claims. Aligns with platform immutables around transparency.

6. **Invitation Integration**: The invitation validation process naturally fits into the registration flow, with the inviter's ID stored in the user record.

7. **Trust Score Context**: Including trust score in the JWT allows the frontend to quickly adapt UI based on user trust level without additional API calls.

### Negative

1. **Token Size**: JWTs are larger than session IDs, increasing request header size. This is acceptable for the current payload size (~500 bytes).

2. **No Server-Side Invalidation**: Tokens cannot be revoked before expiration (without a blocklist). Password changes don't immediately invalidate existing tokens. This is mitigated by the 24-hour expiration.

3. **Secret Compromise**: If JWT_SECRET is compromised, all tokens are compromised. Requires secret rotation procedures.

4. **Storage Security**: Tokens must be stored securely on the client. For the web SPA, this means memory storage (not localStorage) to prevent XSS theft.

5. **Clock Skew**: Token validation can fail due to server clock differences. Short expiration windows mitigate this.

6. **Payload Limitations**: Token payload should remain small. Changes to user role or trust score require re-login to refresh the token (or a refresh token mechanism).

## Alternatives Considered

### Session-Based Authentication (Cookies + Server-Side Sessions)
- **Rejected**: While session-based auth provides immediate invalidation capabilities, it requires server-side session storage (Redis or database) and complicates horizontal scaling. The benefits don't outweigh the complexity for the current requirements.

### OAuth 2.0 / OpenID Connect
- **Rejected**: OAuth is designed for third-party authorization delegation. MuslimEEN is a first-party platform; users authenticate directly with the platform, not through Google/Facebook. External OAuth providers would compromise the platform's independence and privacy principles.

### API Keys
- **Rejected**: API keys are suitable for service-to-service authentication, not user authentication. They don't support expiration or role-based claims without additional infrastructure.

### Passport.js with Multiple Strategies
- **Partially Adopted**: While Passport.js is popular, we implemented a lightweight custom JWT solution to minimize dependencies and maintain full control over the authentication flow. Can be migrated to Passport if additional strategies are needed later.

### HTTP Basic Authentication
- **Rejected**: Basic auth requires sending credentials on every request and doesn't support token expiration or role-based access control.

## References

- [JWT.io](https://jwt.io/) - JWT debugger and documentation
- [RFC 7519 - JSON Web Token (JWT)](https://tools.ietf.org/html/rfc7519)
- [OWASP JWT Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [Backend IAM Module](../../../backend/src/modules/iam/)
- Related ADRs:
  - ADR-001: Modular Architecture (IAM module implements JWT)
  - ADR-005: Repository Pattern (UserRepository for credential verification)
