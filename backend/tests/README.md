# MuslimEEN Backend Tests

## Overview

This directory contains all tests for the MuslimEEN backend, including:
- Unit tests for services and utilities
- Integration tests for API endpoints
- Migration tests for modular architecture transition

## Directory Structure

```
tests/
├── integration/
│   └── migration/
│       └── api-endpoints.test.ts    # API endpoint migration tests
├── modules/
│   ├── iam.parity.test.ts           # IAM parity tests
│   └── marketplace.parity.test.ts   # Marketplace parity tests
├── unit/
│   └── services/                    # Service unit tests (legacy)
├── utils/
│   ├── migrationVerifier.ts         # Migration verification utilities
│   └── moduleTester.ts              # Module testing helpers
├── run-migration-tests.js           # Migration test runner script
├── setup.ts                         # Main Jest setup
├── setup.migration.ts               # Migration test setup
└── MIGRATION_TESTING_GUIDE.md       # Comprehensive testing guide
```

## Quick Start

### Run All Tests

```bash
npm test
```

### Run Migration Tests

```bash
# Run all migration tests
node tests/run-migration-tests.js --all

# Verify migration status only
node tests/run-migration-tests.js --verify

# Test legacy implementation
node tests/run-migration-tests.js --legacy

# Test modular implementation
node tests/run-migration-tests.js --modular

# Run parity tests only
node tests/run-migration-tests.js --parity
```

### Run Specific Test Files

```bash
# Parity tests
npm test -- iam.parity.test.ts

# Integration tests
npm test -- api-endpoints.test.ts

# With coverage
npm test -- --coverage
```

## Test Configuration

### Environment Variables

Create `.env.test.modular` for testing modular implementation:

```env
NODE_ENV=test
DB_NAME=muslimeen_test_modular
JWT_SECRET=test-secret

# Feature Flags
USE_MODULAR_IAM=true
USE_MODULAR_PROFILE=true
USE_MODULAR_TRUST=true
USE_MODULAR_NETWORK=true
USE_MODULAR_MARKETPLACE=true
USE_MODULAR_ISLAMIC_FINANCE=true
```

### Jest Configuration

- `jest.config.js` - Main configuration
- `jest.config.migration.js` - Migration-specific configuration

## Migration Testing

See [MIGRATION_TESTING_GUIDE.md](./MIGRATION_TESTING_GUIDE.md) for detailed information about:
- Setting up the test environment
- Running parity tests
- Verifying module migration status
- Troubleshooting common issues

## Writing Tests

### Parity Test Example

```typescript
import { testBothImplementations } from '../utils/moduleTester';

describe('My Module Parity', () => {
  it('should match legacy behavior', async () => {
    const result = await testBothImplementations(
      () => legacyService.method(data),
      () => modularService.method(data),
      ['field1', 'field2']
    );
    
    expect(result.match).toBe(true);
    expect(result.differences).toHaveLength(0);
  });
});
```

### Integration Test Example

```typescript
import request from 'supertest';
import app from '../../src/server';

describe('API Endpoint', () => {
  it('should return correct response', async () => {
    const response = await request(app)
      .get('/api/endpoint')
      .expect(200);
    
    expect(response.body).toHaveProperty('success', true);
  });
});
```

## Check Migration Status

```bash
curl http://localhost:3001/api/migration-status
```

Response:
```json
{
  "migration": {
    "status": "in-progress",
    "modules": {
      "iam": "modular",
      "profile": "modular",
      ...
    }
  }
}
```

## Troubleshooting

### Tests Failing Due to Database

Ensure test database is running:
```bash
psql -U postgres -c "CREATE DATABASE muslimeen_test_modular;"
```

### Feature Flags Not Working

Feature flags are read at startup. Restart the server after changing environment variables.

### TypeScript Errors

Run type checking:
```bash
npm run type-check
```

## Support

For detailed migration testing instructions, see [MIGRATION_TESTING_GUIDE.md](./MIGRATION_TESTING_GUIDE.md).
