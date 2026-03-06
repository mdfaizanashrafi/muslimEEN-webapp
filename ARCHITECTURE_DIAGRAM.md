# MuslimEEN Backend Architecture - Post-SRP Refactoring

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
│                         (Next.js 14 Frontend)                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼ HTTP/REST
┌─────────────────────────────────────────────────────────────────────────────┐
│                            ROUTER LAYER                                      │
│                           (Express Routes)                                   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  routes/index.ts                                                   │   │
│  │  - URL routing only                                                │   │
│  │  - Applies middleware (auth, validation, rate limiting)            │   │
│  │  - Delegates to controllers                                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CONTROLLER LAYER                                    │
│                     (Thin HTTP Request Handlers)                             │
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │  AuthController │  │  UserController │  │  Other Controllers            │
│  │                 │  │                 │  │                               │
│  │  - Extract req  │  │  - Extract req  │  │  - Extract request data       │
│  │    data         │  │    data         │  │  - Call services              │
│  │  - Call Auth    │  │  - Call User    │  │  - Return HTTP responses      │
│  │    Service      │  │    Service      │  │                               │
│  │  - Return JSON  │  │  - Return JSON  │  │  NO business logic!           │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────────────────┘   │
│           │                    │                    │                        │
│           └────────────────────┴────────────────────┘                        │
│                              │                                               │
└──────────────────────────────┼───────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SERVICE LAYER                                      │
│                    (Business Logic Orchestration)                            │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      AuthService.ts                                  │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │    │
│  │  │ JwtService   │  │ PasswordSvc  │  │ User (model) │              │    │
│  │  │ - generate   │  │ - hash       │  │ - CRUD       │              │    │
│  │  │ - verify     │  │ - verify     │  │              │              │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │    │
│  │                                                                      │    │
│  │  login()      → verify password → generate token → return auth       │    │
│  │  register()   → create user → accept invitation → return auth        │    │
│  │  logout()     → (stateless - client side)                            │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    TrustScoreService.ts                              │    │
│  │                                                                      │    │
│  │  recalculate()  → get metrics → calculate factors → update score     │    │
│  │                   → check witness eligibility                        │    │
│  │                   → create history entry                             │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    ConnectionService.ts                              │    │
│  │                                                                      │    │
│  │  acceptRequest() → update connection → update user counts            │    │
│  │                    (coordinates side effects)                        │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                 IslamicFinanceService.ts                             │    │
│  │                                                                      │    │
│  │  processDonation()  → transaction: insert donation + update campaign │    │
│  │  addLenderToLoan()  → transaction: add lender + check funding        │    │
│  │  calculateZakat()   → pure calculation (no DB)                       │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  Other Services:                                                     │    │
│  │  - UserService.ts          - NotificationService.ts                  │    │
│  │  - VerificationService.ts  - InvitationService.ts                    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────┬───────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MODEL/REPOSITORY LAYER                               │
│                       (Data Access - Future: Repositories)                   │
│                                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │   User   │  │ Connection│  │ TrustScore│  │ Sadaqah  │  │ QardHasan│      │
│  │          │  │          │  │          │  │          │  │          │      │
│  │ - create │  │ - create │  │ - calc   │  │ - create │  │ - create │      │
│  │ - find   │  │ - accept │  │ - metrics│  │ - getAll │  │ - lend   │      │
│  │ - update │  │ - reject │  │ - history│  │ - donate │  │ - repay  │      │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘      │
│       │             │             │             │             │             │
│       └─────────────┴─────────────┴─────────────┴─────────────┘             │
│                              │                                               │
└──────────────────────────────┼───────────────────────────────────────────────┘
                               │
                               ▼ SQL/PostgreSQL
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATABASE LAYER                                     │
│                             (PostgreSQL)                                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Responsibility Boundaries

### Router Layer
- **Single Responsibility:** URL routing
- **Does:** Map URLs to controllers, apply middleware
- **Does NOT:** Business logic, data access

### Controller Layer
- **Single Responsibility:** HTTP request/response handling
- **Does:** Extract request data, call services, return JSON
- **Does NOT:** Business logic, database queries, side effects

### Service Layer
- **Single Responsibility:** Business logic orchestration
- **Does:** Coordinate multiple models, manage transactions, handle side effects
- **Does NOT:** HTTP handling, direct SQL queries

### Model/Repository Layer
- **Single Responsibility:** Data access
- **Does:** Single-table CRUD, SQL queries, data formatting
- **Does NOT:** Business logic, cross-table operations (use services)

## Service Dependencies

```
AuthService
├── JwtService (token generation/verification)
├── PasswordService (hashing/verification)
└── User (model - data access)

TrustScoreService
├── User (model)
└── TrustScore (model)

ConnectionService
├── Connection (model)
└── User (model - for count updates)

VerificationService
├── User (model)
├── TrustScoreService (recalculation)
└── NotificationService (notifications)

IslamicFinanceService
├── Sadaqah (model)
├── QardHasan (model)
└── ZakatCalculator (pure functions)

InvitationService
├── Invitation (model)
└── TrustScoreService (recalculation)
```

## Before vs After Comparison

### Before (SRP Violations)

| File | Lines | Responsibilities |
|------|-------|------------------|
| `authController.ts` | 265 | HTTP + Auth logic + Token generation + Password verification + User updates |
| `userController.ts` | 149 | HTTP + Profile + Trust Score + Connections + Notifications |
| `Connection.js` | 208 | SQL + Business logic + Side effects (count updates) |
| `TrustScore.js` | 197 | Calculation + Metrics + User updates + History creation |

**Problems:**
- Controllers had business logic
- Models had cross-table operations
- Hidden side effects everywhere
- Tight coupling
- Hard to test

### After (SRP Compliant)

| File | Lines | Responsibility |
|------|-------|----------------|
| `authController.ts` | 130 | HTTP handling only |
| `AuthService.ts` | 240 | Auth business logic |
| `JwtService.ts` | 75 | Token operations |
| `PasswordService.ts` | 70 | Password operations |

**Improvements:**
- Controllers: Single responsibility (HTTP)
- Services: Single responsibility (business logic)
- Utilities: Single responsibility (pure functions)
- Clear separation of concerns
- Easy to test

## Key Improvements

### 1. Explicit Side Effects

**Before:**
```typescript
// Controller
await User.update(userId, updates);
// Hidden: Automatically recalculates trust score
```

**After:**
```typescript
// Controller
await UserService.updateProfile(userId, updates);
// Explicit: Profile updated only

// Separate call for recalculation
await TrustScoreService.recalculate(userId);
```

### 2. Typed Errors

**Before:**
```typescript
throw new Error('Invalid credentials');
```

**After:**
```typescript
throw new AuthError('INVALID_CREDENTIALS', 'Invalid email or password', 401);
```

### 3. Transaction Coordination

**Before:**
```typescript
// In model - hidden transaction
static async recordDonation(...) {
  // Begin transaction
  // Insert donation
  // Update campaign
  // Commit
}
```

**After:**
```typescript
// In service - explicit coordination
export const processDonation = async (...) => {
  // Validation
  // Call model (which handles transaction)
  // Return result
};
```

### 4. Testability

**Before:**
```typescript
// Hard to test - controller mixes HTTP with logic
export const login = async (req, res) => {
  const user = await User.findByEmail(req.body.email);
  const isValid = await User.verifyPassword(user, req.body.password);
  // ... more logic
};
```

**After:**
```typescript
// Easy to test - service is pure logic
export const login = async (credentials) => {
  const user = await User.findByEmail(credentials.email);
  const isValid = await PasswordService.verifyPassword(...);
  // ...
};
```

## Migration Path for Developers

### Adding a New Feature

1. **Define the service interface** (`services/NewFeatureService.ts`)
2. **Implement business logic** in service
3. **Create controller method** that calls service
4. **Add route** pointing to controller
5. **Add validation schema** if needed

### Refactoring Existing Code

1. Identify business logic in controller/model
2. Create new service method
3. Move logic to service
4. Update controller to call service
5. Add tests for service
6. Verify controller still works

## Future Enhancements

### Phase 8: Repository Pattern
```
services/
repositories/  <-- NEW
  - UserRepository.ts
  - ConnectionRepository.ts
  - etc.
models/        <-- Deprecated, move to repositories
```

### Phase 9: Event-Driven Architecture
```
services/
  - emit event instead of direct calls
  
eventHandlers/
  - TrustScoreRecalculator.ts
  - NotificationSender.ts
```

### Phase 10: Dependency Injection
```typescript
// Instead of:
import * as UserService from './UserService';

// Use:
constructor(private userService: IUserService) {}
```

## Summary

| Metric | Before | After |
|--------|--------|-------|
| Controller avg lines | 150 | 75 |
| Services created | 0 | 9 |
| Typed errors | 0 | 8 |
| Testable units | Few | Many |
| Side effects | Hidden | Explicit |
| Coupling | High | Low |

**Status:** ✅ Complete and ready for production
