# Migration Testing Guide

This guide explains how to test the modular architecture migration to ensure both legacy and modular implementations work correctly.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Test Environment Setup](#test-environment-setup)
3. [Running Tests](#running-tests)
4. [Test Types](#test-types)
5. [Migration Verification](#migration-verification)
6. [Troubleshooting](#troubleshooting)

## Quick Start

```bash
# Verify migration status
node tests/run-migration-tests.js --verify

# Run all migration tests (both legacy and modular)
node tests/run-migration-tests.js --all

# Test specific mode
node tests/run-migration-tests.js --legacy    # Legacy only
node tests/run-migration-tests.js --modular   # Modular only
node tests/run-migration-tests.js --parity    # Parity tests only
```

## Test Environment Setup

### 1. Environment Variables

Create a `.env.test.modular` file in the backend directory:

```env
# Test Environment for Modular Architecture
NODE_ENV=test
DB_NAME=muslimeen_test_modular
JWT_SECRET=test-secret
BCRYPT_ROUNDS=4

# Feature Flags - Toggle these to test different modules
USE_MODULAR_IAM=true
USE_MODULAR_PROFILE=true
USE_MODULAR_TRUST=true
USE_MODULAR_NETWORK=true
USE_MODULAR_MARKETPLACE=true
USE_MODULAR_ISLAMIC_FINANCE=true
USE_MODULAR_NOTIFICATIONS=false
USE_MODULAR_INVITATIONS=false
```

### 2. Test Database

Create a separate test database to avoid polluting development data:

```bash
# Create test database
psql -U postgres -c "CREATE DATABASE muslimeen_test_modular;"

# Run migrations
psql -U postgres -d muslimeen_test_modular -f database/migrations/001_initial_schema.sql

# Seed test data
node scripts/seed-test-data.js
```

### 3. Install Test Dependencies

```bash
npm install --save-dev supertest @types/supertest
```

## Running Tests

### Unit Tests

```bash
# Run all unit tests
npm run test:unit

# Run tests for specific module
npm test -- --testPathPattern="iam.parity"

# Run with coverage
npm test -- --coverage
```

### Integration Tests

```bash
# Run migration integration tests
npm test -- --testPathPattern="migration"

# Run API endpoint tests
npm test -- --testPathPattern="api-endpoints"
```

### Parity Tests

Parity tests compare legacy and modular implementations:

```bash
# Run all parity tests
npm test -- --testPathPattern="parity"

# Specific module parity test
npm test -- iam.parity.test.ts
```

## Test Types

### 1. Parity Tests

Located in `tests/modules/*.parity.test.ts`

These tests ensure identical behavior between legacy and modular implementations:

```typescript
describe('IAM Module Parity Tests', () => {
  it('should have matching invitation validation logic', async () => {
    const legacyResult = await legacyAuthService.validateInvitation(code);
    const modularResult = await modularAuthService.validateInvitation(code);
    
    expect(legacyResult).toEqual(modularResult);
  });
});
```

### 2. Integration Tests

Located in `tests/integration/migration/`

These test the API endpoints with different feature flag configurations:

```typescript
describe('API Endpoints Migration Tests', () => {
  it('should work with legacy implementation', async () => {
    overrideFeatureFlag('useModularIAM', false);
    
    const response = await request(app)
      .post('/api/auth/login')
      .send(credentials);
      
    expect(response.status).toBe(200);
  });
});
```

### 3. Migration Verification

Run the verification script to check all modules:

```typescript
import { verifyMigration, printVerificationResults } from './utils/migrationVerifier';

const results = await verifyMigration();
printVerificationResults(results);
```

Expected output:
```
========================================
   MIGRATION VERIFICATION RESULTS
========================================

✅ OK:
   IAM: Using modular implementation
   Profile: Using modular implementation
   Trust: Using modular implementation
   Network: Using modular implementation
   Marketplace: Using modular implementation
   Islamic Finance: Using modular implementation
   Invitations: Using legacy implementation
   Notifications: Using legacy implementation

========================================
   Total: 8 | ✅ 8 | ⚠️ 0 | ❌ 0
========================================
```

## Migration Verification

### Check Migration Status via API

```bash
curl http://localhost:3001/api/migration-status
```

Response:
```json
{
  "name": "MuslimEEN API",
  "version": "1.0.0",
  "migration": {
    "status": "in-progress",
    "modules": {
      "iam": "modular",
      "profile": "modular",
      "trust": "modular",
      "network": "modular",
      "marketplace": "modular",
      "islamicFinance": "modular",
      "notifications": "legacy",
      "invitations": "legacy"
    }
  }
}
```

### Module Readiness Checklist

Use this checklist before enabling each module in production:

#### IAM Module
- [ ] `validateInvitation` works correctly
- [ ] `login` returns correct response format
- [ ] `register` creates user properly
- [ ] `logout` invalidates session
- [ ] `getCurrentUser` returns user data
- [ ] JWT tokens are generated correctly
- [ ] Password hashing works
- [ ] Error handling matches legacy

#### Profile Module
- [ ] `getCurrentUserProfile` returns correct data
- [ ] `updateCurrentUserProfile` updates fields
- [ ] `getPublicProfile` returns limited data
- [ ] Profile validation works

#### Trust Module
- [ ] `getCurrentTrustScore` returns score
- [ ] `recalculateCurrentTrustScore` updates score
- [ ] `getCurrentUserTrustScoreHistory` returns history
- [ ] Verification endpoints work

#### Network Module
- [ ] `getCurrentUserConnections` returns connections
- [ ] `getCurrentUserPendingConnections` returns pending
- [ ] `sendConnectionRequestToUser` creates request
- [ ] `acceptIncomingConnectionRequest` accepts
- [ ] `rejectIncomingConnectionRequest` rejects
- [ ] `removeConnection` removes connection

#### Marketplace Module
- [ ] `getMarketplaceListings` returns listings
- [ ] `getListingById` returns single listing
- [ ] `createListing` creates listing
- [ ] `updateListing` updates listing
- [ ] `removeListing` deletes listing
- [ ] `recordInvestment` records investment

#### Islamic Finance Module
- [ ] `getSadaqahCampaigns` returns campaigns
- [ ] `donate` records donation
- [ ] `getWaqfListings` returns waqf
- [ ] `getQardHasanLoans` returns loans
- [ ] `createQardHasanLoan` creates loan
- [ ] `lendToQardHasan` funds loan
- [ ] `repayQardHasan` records repayment
- [ ] `calculateZakat` calculates correctly

## Troubleshooting

### Common Issues

#### 1. Feature Flags Not Working

**Problem**: Changes to feature flags don't take effect.

**Solution**: Feature flags are read at startup. Restart the server after changing environment variables.

```bash
# Stop server
# Edit .env file
# Start server
npm run dev
```

#### 2. Module Import Errors

**Problem**: `Cannot find module` errors.

**Solution**: Check the import paths. Modular imports should use relative paths:

```typescript
// Correct
import * as AuthService from '../services/AuthService';

// Incorrect
import * as AuthService from '../../services/AuthService';
```

#### 3. Test Timeouts

**Problem**: Tests timeout waiting for database.

**Solution**: Ensure test database is running and accessible:

```bash
# Check database connection
node scripts/test-connection.js
```

#### 4. Parity Test Failures

**Problem**: Legacy and modular implementations return different results.

**Solution**: 
1. Run the verification script to identify which module has issues
2. Compare the implementations side-by-side
3. Update the modular implementation to match legacy behavior
4. Re-run parity tests

```typescript
// Use testBothImplementations helper
const result = await testBothImplementations(
  () => legacyService.method(data),
  () => modularService.method(data),
  ['field1', 'field2', 'nested.field3'] // Fields to compare
);

console.log(result.differences); // Shows exactly what's different
```

### Debug Mode

Enable debug logging for tests:

```bash
LOG_LEVEL=debug npm test
```

### Database Reset

Reset test database to known state:

```bash
# Drop and recreate
psql -U postgres -c "DROP DATABASE IF EXISTS muslimeen_test_modular;"
psql -U postgres -c "CREATE DATABASE muslimeen_test_modular;"
psql -U postgres -d muslimeen_test_modular -f database/migrations/001_initial_schema.sql
```

## Best Practices

1. **Test Incrementally**: Enable one module at a time and verify it works before moving to the next.

2. **Use Feature Flags**: Always use feature flags to toggle between implementations, never hardcode.

3. **Run Parity Tests**: Before declaring a module ready, ensure all parity tests pass.

4. **Monitor Logs**: Watch for errors in both legacy and modular implementations.

5. **Document Differences**: If modular implementation intentionally differs from legacy, document why.

6. **Rollback Plan**: Keep the backup branch (`backup/legacy-architecture-pre-migration`) until fully migrated.

## Production Deployment Checklist

Before deploying to production:

- [ ] All parity tests pass
- [ ] Integration tests pass with modular flags enabled
- [ ] Migration verification shows no errors
- [ ] Database migrations are up to date
- [ ] Environment variables are configured
- [ ] Monitoring and alerting are in place
- [ ] Rollback plan is documented
- [ ] Team has been notified of changes
