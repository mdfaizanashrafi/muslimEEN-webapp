# MuslimEEN - Backend Comprehension Guide

## Overview

This document provides comprehensive guidance for backend developers integrating with the MuslimEEN frontend application.

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   API Gateway   │────▶│   Microservices │
│   (Static HTML) │◀────│   (Auth/Rate)   │◀────│   (Business)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                              │
                              ▼
                        ┌─────────────────┐
                        │   Database      │
                        │   (PostgreSQL)  │
                        └─────────────────┘
```

## Frontend Expectations

### 1. Authentication Flow

```
1. User enters invitation code
   POST /api/auth/validate-invitation
   
2. User logs in with credentials
   POST /api/auth/login
   
3. Frontend stores JWT token
   localStorage: { token, user, expiresAt }
   
4. Subsequent requests include:
   Authorization: Bearer {token}
```

### 2. Session Management

Frontend expects:
- Token expiration: 24 hours
- Refresh token mechanism (optional)
- Automatic logout on 401 response
- Session persistence via localStorage

### 3. API Response Format

All responses MUST follow this structure:

```json
{
  "success": true|false,
  "data": { ... },
  "message": "Human-readable message",
  "error": {
    "code": "ERROR_CODE",
    "details": { ... }
  }
}
```

## Data Models

### User Model

```typescript
interface User {
  id: string;                    // UUID
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;              // Computed: firstName + lastName
  role: 'muslim_verified' | 'muslim_unverified' | 'non_muslim' | 'business_provider';
  verificationTier: 'basic' | 'full' | 'business';
  trustScore: number;            // 0-1000
  trustScoreHistory: Array<{
    date: string;                // ISO 8601
    score: number;
  }>;
  bio: string;
  location: string;
  industry: string;
  skills: string[];
  endorsements: number;
  connections: number;
  profileViews: number;
  isWitnessEligible: boolean;    // trustScore >= 200
  badges: ('biometric' | 'two_witness' | 'business' | 'institutional')[];
  workHistory: WorkHistory[];
  education: Education[];
  createdAt: string;
  lastLogin: string;
}
```

### Trust Score Calculation

```typescript
interface TrustScoreFactors {
  profileCompleteness: number;   // Max 100 points
  connectionQuality: number;     // Max 50 points
  communityContributions: number; // Max 50 points
  verificationLevel: number;     // Basic: 50, Full: 100, Business: 150
  endorsements: number;          // 1 point per endorsement, max 100
  successfulInvites: number;     // +10 per successful invite
  failedInvites: number;         // -50 per banned invitee
  disputeResolutions: number;    // +/- based on outcomes
}

// Formula: Sum of all factors, capped at 1000
const calculateTrustScore = (factors: TrustScoreFactors): number => {
  return Math.min(1000, Math.max(0, 
    factors.profileCompleteness +
    factors.connectionQuality +
    factors.communityContributions +
    factors.verificationLevel +
    factors.endorsements +
    (factors.successfulInvites * 10) +
    (factors.failedInvites * -50)
  ));
};
```

### Invitation System

```typescript
interface Invitation {
  id: string;
  code: string;                  // 12-character alphanumeric
  inviterId: string;             // User who sent invitation
  inviteeEmail: string;          // Pre-registered email
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  createdAt: string;
  expiresAt: string;             // 30 days from creation
  acceptedAt?: string;
  inviteeId?: string;            // Set when accepted
}

// Invitation tracking for trust score
interface InvitationOutcome {
  invitationId: string;
  inviterId: string;
  outcome: 'success' | 'banned' | 'expired';
  trustImpact: number;           // +10 or -50
  processedAt: string;
}
```

## Verification System

### Verification Flow

```
1. Email Verification
   - Send verification email
   - User clicks link
   - Mark email as verified

2. Biometric Verification
   - Frontend uses WebAuthn API
   - Backend stores public key credential
   - Challenge-response authentication

3. Two-Witness Verification
   - User requests witnesses
   - Two verified members vouch
   - Witnesses must have trustScore >= 200
   - Each witness gets +5 trust points

4. Business Verification (Optional)
   - Submit business documents
   - Manual review by admin
   - Business badge awarded
```

### Witness Requirements

```typescript
interface WitnessRequirement {
  minTrustScore: 200;
  mustBeVerified: true;
  cannotWitnessFor: 'family' | 'business_partner'; // Conflict of interest
  maxWitnessesPerMonth: 5;
  trustScoreReward: 5;
}
```

## Marketplace System

### Vertical Structure

```typescript
type Vertical = 'earn' | 'build' | 'live' | 'protect';

interface MarketplaceItem {
  id: string;
  vertical: Vertical;
  category: string;
  subcategory?: string;
  provider: {
    id: string;
    name: string;
    trustScore: number;
    verified: boolean;
    badges: string[];
  };
  title: string;
  description: string;
  location: string;
  // Vertical-specific fields
  rate?: string;           // EARN
  salary?: string;         // EARN (jobs)
  seeking?: number;        // BUILD (investment)
  raised?: number;         // BUILD
  price?: string;          // LIVE
  coverage?: string;       // PROTECT
}
```

### Search & Filtering

Frontend sends:
```
GET /marketplace/{vertical}?category=&location=&trustScoreMin=&search=&limit=&offset=
```

Backend should support:
- Full-text search on title and description
- Category filtering (exact match)
- Location filtering (partial match)
- Trust score minimum (range filter)
- Pagination (limit/offset)

## Islamic Finance System

### Sadaqah (Charity)

```typescript
interface SadaqahCampaign {
  id: string;
  name: string;
  organization: string;
  description: string;
  goal: number;
  raised: number;
  donors: number;
  startDate: string;
  endDate: string;
  category: 'emergency' | 'education' | 'health' | 'water' | 'food' | 'other';
  imageUrl?: string;
  verified: boolean;
}

interface Donation {
  id: string;
  campaignId: string;
  donorId: string;
  amount: number;
  currency: string;
  anonymous: boolean;
  message?: string;
  createdAt: string;
}
```

### Zakat Calculator

```typescript
interface ZakatCalculation {
  cash: number;
  gold: number;
  silver: number;
  investments: number;
  businessAssets: number;
  debts: number;
  nisabType: 'gold' | 'silver';
}

interface ZakatResult {
  totalWealth: number;
  deductibleDebts: number;
  zakatableWealth: number;
  nisabThreshold: number;        // Current nisab value
  zakatPayable: boolean;
  zakatAmount: number;           // 2.5% of zakatable wealth
  distribution: {
    poor: number;
    needy: number;
    zakatAdministrators: number;
    thoseWhoseHearts: number;
    freeingCaptives: number;
    debtors: number;
    inCauseOfAllah: number;
    wayfarers: number;
  };
}
```

### Qard Hasan (Benevolent Loan)

```typescript
interface QardHasanLoan {
  id: string;
  borrowerId: string;
  amount: number;
  purpose: string;
  term: number;                  // Months
  repaid: number;
  lenders: Array<{
    userId: string;
    amount: number;
    contributedAt: string;
  }>;
  status: 'funding' | 'active' | 'repaid' | 'defaulted';
  createdAt: string;
}

// No interest - pure benevolent loan
// Lenders can be multiple users pooling together
```

## Notification System

### Notification Types

```typescript
type NotificationType = 
  | 'connection_request'
  | 'connection_accepted'
  | 'endorsement_received'
  | 'trust_score_changed'
  | 'verification_completed'
  | 'message_received'
  | 'marketplace_interest'
  | 'dispute_resolution';

interface Notification {
  id: string;
  userId: string;                // Recipient
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actor?: {                      // Who triggered the notification
    id: string;
    name: string;
    trustScore: number;
  };
  actionUrl?: string;            // Where to navigate on click
  data?: Record<string, any>;    // Additional context
}
```

### Real-time Delivery

Options:
1. **WebSockets** - For instant delivery
2. **Server-Sent Events** - For one-way updates
3. **Polling** - Frontend polls every 30 seconds (fallback)

## Security Requirements

### Authentication

```typescript
// JWT Token Structure
interface JWTPayload {
  sub: string;                   // User ID
  email: string;
  role: string;
  iat: number;                   // Issued at
  exp: number;                   // Expiration (24h)
}

// Token Validation
- Verify signature
- Check expiration
- Validate issuer
- Check if token is revoked (optional)
```

### Rate Limiting

| Endpoint | Limit |
|----------|-------|
| /auth/* | 5/minute |
| /user/* | 100/minute |
| /marketplace/* | 100/minute |
| /messages/* | 60/minute |

### CORS Configuration

```javascript
// Allow only muslimeen.org and subdomains
const allowedOrigins = [
  'https://muslimeen.org',
  'https://www.muslimeen.org',
  'https://app.muslimeen.org'
];
```

## Database Schema (Simplified)

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(50) DEFAULT 'muslim_unverified',
  verification_tier VARCHAR(50) DEFAULT 'basic',
  trust_score INTEGER DEFAULT 0 CHECK (trust_score >= 0 AND trust_score <= 1000),
  bio TEXT,
  location VARCHAR(255),
  industry VARCHAR(100),
  is_witness_eligible BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP
);

-- Invitations table
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(12) UNIQUE NOT NULL,
  inviter_id UUID REFERENCES users(id),
  invitee_email VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '30 days',
  accepted_at TIMESTAMP
);

-- Trust score history
CREATE TABLE trust_score_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  score INTEGER NOT NULL,
  recorded_at TIMESTAMP DEFAULT NOW()
);

-- Connections
CREATE TABLE connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID REFERENCES users(id),
  recipient_id UUID REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  accepted_at TIMESTAMP
);

-- Marketplace items
CREATE TABLE marketplace_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vertical VARCHAR(20) NOT NULL,
  category VARCHAR(100) NOT NULL,
  provider_id UUID REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  location VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Testing Requirements

### Unit Tests
- Trust score calculation
- Invitation validation
- User role permissions

### Integration Tests
- Full authentication flow
- Marketplace CRUD operations
- Islamic finance calculations

### Load Tests
- 1000 concurrent users
- API response time < 200ms
- Database query time < 50ms

## Deployment Checklist

- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] Rate limiting enabled
- [ ] CORS configured
- [ ] Logging configured
- [ ] Monitoring enabled
- [ ] Backup strategy in place

## Monitoring & Alerts

### Key Metrics
- API response times
- Error rates
- Active users
- Trust score distribution
- Verification completion rates

### Alerts
- Error rate > 1%
- API latency > 500ms
- Database connection failures
- Disk space > 80%

## Support & Contact

For backend integration questions:
- Technical Team: backend@muslimeen.org
- API Documentation: https://docs.muslimeen.org
- Status Page: https://status.muslimeen.org

---

**Version**: 1.0
**Last Updated**: May 2024
