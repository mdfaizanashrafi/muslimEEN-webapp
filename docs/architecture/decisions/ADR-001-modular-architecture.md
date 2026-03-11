# ADR-001: Modular Architecture with Feature Flags

## Status
- **Accepted**

## Context

MuslimEEN started as a monolithic Express.js application with a traditional MVC structure where controllers directly accessed database models. As the platform grew to include multiple complex domains (IAM, Islamic Finance, Marketplace, Trust & Verification, Network), several critical issues emerged:

1. **Tight Coupling**: Business logic was scattered across controllers, making it difficult to understand which code owned which data
2. **Unclear Boundaries**: The Islamic Finance module (handling Zakat, Qard Hasan, Sadaqah, Waqf) was intertwined with user profile logic
3. **Testing Difficulties**: Monolithic structure made unit testing nearly impossible without database dependencies
4. **Team Scalability**: Multiple developers working on the same codebase created frequent merge conflicts and regressions
5. **Deployment Risk**: Any change required full application redeployment, increasing risk for critical Islamic finance features

The platform's core immutables (open source AGPL-3.0, no interest-based finance) require high confidence in code changes, particularly for financial calculations where errors could have Shariah compliance implications.

## Decision

We will adopt a **modular architecture** with the following characteristics:

### Module Structure
Each module is a self-contained unit with clear boundaries:

```
backend/src/modules/
├── iam/                    # Identity & Access Management
├── profile/                # User profiles
├── trust/                  # Trust scores & verification (biometric & business only)
├── network/                # Connections & networking
├── marketplace/            # EARN, BUILD, LIVE, PROTECT verticals
├── islamic-finance/        # Zakat, Qard Hasan, Sadaqah, Waqf
├── invites/                # Invitation-based onboarding system
└── shared/                 # Cross-cutting concerns
```

**Note**: The verification module only supports biometric and business verification. The witness verification system has been removed in favor of invitation-only onboarding.

Each module contains:
- `controllers/` - HTTP request handling
- `services/` - Business logic
- `repositories/` - Data access layer
- `index.ts` - Public API surface

### Feature Flags for Gradual Migration

To enable safe migration from the legacy codebase without disruption:

```typescript
// backend/src/modules/shared/config/featureFlags.ts
export const featureFlags = {
  useModularIAM: process.env.USE_MODULAR_IAM === 'true',
  useModularProfile: process.env.USE_MODULAR_PROFILE === 'true',
  useModularTrust: process.env.USE_MODULAR_TRUST === 'true',
  useModularNetwork: process.env.USE_MODULAR_NETWORK === 'true',
  useModularInvites: process.env.USE_MODULAR_INVITES === 'true',
  useModularMarketplace: process.env.USE_MODULAR_MARKETPLACE === 'true',
  useModularIslamicFinance: process.env.USE_MODULAR_ISLAMIC_FINANCE === 'true',
};
```

**Note**: Notifications feature flag has been removed as the module was not implemented.

Route selection based on feature flags:
```typescript
// routes/index.ts
import { featureFlags } from '../modules/shared/config/featureFlags';

router.use('/auth', featureFlags.useModularIAM 
  ? modularAuthRoutes 
  : legacyAuthRoutes
);
```

## Consequences

### Positive

1. **Clear Domain Boundaries**: Each module owns its data and business rules. The Islamic Finance module independently manages Zakat calculations, Qard Hasan loans, Sadaqah campaigns, and Waqf operations without interference from other domains.

2. **Independent Testing**: Modules can be unit tested in isolation with mocked dependencies. The ZakatCalculator service can be tested without a database connection.

3. **Gradual Migration**: Feature flags allow incremental migration of modules from legacy to modular structure without downtime. Critical financial features can be migrated last after thorough testing.

4. **Team Parallelization**: Different teams can work on different modules simultaneously with minimal merge conflicts.

5. **Technology Flexibility**: Future modules could potentially use different technologies (e.g., a specialized service for biometric verification) without affecting existing code.

6. **Shariah Compliance Confidence**: Isolated Islamic Finance module allows for focused audits of financial logic by Islamic scholars without needing to understand the entire codebase.

7. **Reusability**: The IAM module's authentication services can be clearly exported for use by the admin panel or future mobile applications.

8. **Invitation-Only Security**: The invites module provides controlled onboarding, replacing the witness verification system for better security and trust management.

### Negative

1. **Initial Complexity**: Developers must understand the module structure and feature flag system before making changes. Onboarding time increases temporarily.

2. **Code Duplication Risk**: Without discipline, utility functions may be duplicated across modules instead of being placed in `shared/`.

3. **Feature Flag Management**: Flags must be carefully tracked and eventually removed after full migration. Dead code from legacy routes must be cleaned up.

4. **Cross-Module Communication**: Modules that need to communicate must do so through well-defined interfaces (events or service calls), which adds architectural overhead compared to direct function calls.

5. **Build Complexity**: The build process may need adjustment if modules are eventually split into separate deployable units.

## Alternatives Considered

### Microservices Architecture
- **Rejected**: While microservices offer the ultimate separation, they introduce significant operational complexity (service discovery, inter-service communication, distributed transactions) that is unnecessary for a platform at MuslimEEN's current scale. The modular monolith provides 80% of the benefits with 20% of the operational overhead.

### Monorepo with Packages
- **Rejected**: Using separate npm packages for each module would enforce boundaries but add build complexity and versioning overhead. Internal modules that change frequently would require constant version bumps and npm publishes during development.

### Clean Architecture / Hexagonal Architecture
- **Partially Adopted**: We adopted the repository pattern and dependency inversion principles from Clean Architecture but kept the directory structure flatter for pragmatic development velocity. Full hexagonal architecture with ports and adapters was deemed overly abstract for the current team size.

### Status Quo (Monolithic MVC)
- **Rejected**: Continuing with the existing structure would accumulate technical debt and make the Islamic Finance features increasingly risky to modify.

## Changes Log

- **2026-03-07**: Updated to reflect removal of witness verification system and notification module
- **2026-03-07**: Changed module name from "invitations" to "invites" to match actual folder structure

## References

- [Modular Monolith Architecture](https://www.deconstructconf.com/2019/stefan-tilkov-maxis-what-makes-modular-monoliths)
- [Feature Toggles](https://martinfowler.com/articles/feature-toggles.html) - Martin Fowler
- Related ADRs:
  - ADR-005: Repository Pattern
  - ADR-004: JWT Authentication (implemented in IAM module)
