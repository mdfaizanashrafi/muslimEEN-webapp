# MuslimEEN Testing Guide

Comprehensive testing documentation for the MuslimEEN platform, covering unit tests, integration tests, and E2E tests.

## Table of Contents

- [Overview](#overview)
- [Test Types](#test-types)
- [Running Tests](#running-tests)
- [Test Organization](#test-organization)
- [Writing New Tests](#writing-new-tests)
- [E2E Test Best Practices](#e2e-test-best-practices)
- [CI Integration](#ci-integration)
- [Troubleshooting](#troubleshooting)

## Overview

MuslimEEN uses a three-tier testing strategy:

1. **Unit Tests** - Test individual functions and services in isolation
2. **Integration Tests** - Test API endpoints with real database
3. **E2E Tests** - Test complete user flows in real browsers

### Test Tools

| Test Type | Tool | Location |
|-----------|------|----------|
| Unit Tests | Jest | `backend/tests/unit/` |
| Integration Tests | Jest + Supertest | `backend/tests/integration/` |
| E2E Tests | Playwright | `e2e/tests/` |

## Test Types

### Unit Tests

Unit tests focus on testing individual functions and services in isolation, using mocks for dependencies.

**Key areas:**
- Authentication services
- Trust score calculations
- Invitation validation
- Utility functions

**Example:**
```typescript
// backend/tests/unit/services/PasswordService.test.ts
describe('PasswordService', () => {
  it('should hash password correctly', async () => {
    const hash = await PasswordService.hash('password123');
    expect(hash).not.toBe('password123');
    expect(await PasswordService.compare('password123', hash)).toBe(true);
  });
});
```

### Integration Tests

Integration tests test API endpoints with a real PostgreSQL database, ensuring all components work together.

**Key areas:**
- Authentication endpoints
- Profile management
- Connections/network
- Marketplace operations

**Features:**
- Real database interactions
- JWT token handling
- Request/response validation
- Database cleanup between tests

### E2E Tests

E2E tests simulate real user interactions in browsers using Playwright.

**Key areas:**
- Complete user flows
- Cross-browser compatibility
- Responsive design testing
- Authentication flows

**Browsers tested:**
- Chromium (Chrome)
- Firefox
- Mobile Chrome (Pixel 5)
- Mobile Safari (iPhone 12)

## Running Tests

### Quick Reference

```bash
# Run all tests (unit + integration)
npm test

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI mode
npm run test:e2e:ui

# Run E2E tests in debug mode
npm run test:e2e:debug

# Run all test types
npm run test:all

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Detailed Commands

#### Unit Tests

```bash
cd backend
npm run test:unit

# With coverage
npm run test:unit -- --coverage

# Specific file
npm run test:unit -- PasswordService.test.ts
```

#### Integration Tests

```bash
# Ensure test database exists
psql -U postgres -c "CREATE DATABASE muslimeen_test;"

# Run integration tests
npm run test:integration

# With verbose output
npm run test:integration -- --verbose
```

#### E2E Tests

```bash
# Run all E2E tests
npx playwright test

# Run specific test file
npx playwright test auth.spec.ts

# Run in headed mode (see browser)
npx playwright test --headed

# Run with UI mode (interactive)
npx playwright test --ui

# Run specific project (browser)
npx playwright test --project=chromium
npx playwright test --project=firefox

# Run with debug
npx playwright test --debug

# Generate and open HTML report
npx playwright show-report
```

## Test Organization

### Backend Tests

```
backend/tests/
├── integration/
│   ├── setup.ts                 # Integration test setup
│   ├── auth.test.ts            # Authentication API tests
│   ├── profile.test.ts         # Profile API tests
│   ├── connections.test.ts     # Connections API tests
│   └── marketplace.test.ts     # Marketplace API tests
├── unit/
│   └── services/
│       ├── auth/
│       ├── PasswordService.test.ts
│       ├── TrustScoreService.test.ts
│       └── ...
├── mocks/
│   ├── user.mock.ts
│   ├── connection.mock.ts
│   └── ...
├── utils/
│   └── test-helpers.ts
└── setup.ts                     # Global test setup
```

### E2E Tests

```
e2e/
├── playwright.config.ts         # Playwright configuration
├── tests/
│   ├── auth.spec.ts            # Authentication flows
│   ├── profile.spec.ts         # Profile management
│   ├── dashboard.spec.ts       # Dashboard functionality
│   ├── marketplace.spec.ts     # Marketplace browsing
│   └── islamic-finance.spec.ts # Islamic finance tools
└── test-results/               # Test output (gitignored)
```

## Writing New Tests

### Unit Tests

```typescript
import { describe, it, expect, jest } from '@jest/globals';
import { MyService } from '../../src/services/MyService';

describe('MyService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should perform expected action', async () => {
    // Arrange
    const input = { id: '123', name: 'Test' };
    
    // Act
    const result = await MyService.process(input);
    
    // Assert
    expect(result).toBeDefined();
    expect(result.id).toBe('123');
  });

  it('should handle errors gracefully', async () => {
    // Arrange
    const invalidInput = null;
    
    // Act & Assert
    await expect(MyService.process(invalidInput))
      .rejects
      .toThrow('Invalid input');
  });
});
```

### Integration Tests

```typescript
import request from 'supertest';
import { app, testPool } from './setup';

describe('My API Endpoint', () => {
  let authToken: string;

  beforeAll(async () => {
    // Setup test data and authenticate
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password' });
    authToken = response.body.token;
  });

  it('should return data for authenticated user', async () => {
    const response = await request(app)
      .get('/api/my-endpoint')
      .set('Authorization', `Bearer ${authToken}`)
      .expect('Content-Type', /json/);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
  });

  it('should reject unauthenticated requests', async () => {
    const response = await request(app)
      .get('/api/my-endpoint')
      .expect('Content-Type', /json/);

    expect(response.status).toBe(401);
  });
});
```

### E2E Tests

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('user can perform action', async ({ page }) => {
    // Navigate to feature
    await page.goto('/my-feature');
    await page.waitForLoadState('networkidle');

    // Perform actions
    await page.fill('[name="input"]', 'test value');
    await page.click('button[type="submit"]');

    // Verify results
    await expect(page.locator('.success-message')).toBeVisible();
    await expect(page).toHaveURL('/success');
  });
});
```

## E2E Test Best Practices

### 1. Use Data Test IDs

Add `data-testid` attributes to elements for reliable selection:

```tsx
<button data-testid="submit-button">Submit</button>
```

```typescript
await page.click('[data-testid="submit-button"]');
```

### 2. Handle Flakiness

```typescript
// Wait for network to be idle
await page.waitForLoadState('networkidle');

// Use expect with timeout
await expect(page.locator('.result')).toBeVisible({ timeout: 10000 });

// Retry flaky operations
test('flaky test', async ({ page }) => {
  await expect.poll(async () => {
    return await page.locator('.status').textContent();
  }, {
    timeout: 10000,
  }).toBe('complete');
});
```

### 3. Test Independent Setup

Each test should set up its own state:

```typescript
test.beforeEach(async ({ page }) => {
  // Create unique test data
  const uniqueEmail = `test${Date.now()}@example.com`;
  // ... setup
});
```

### 4. Skip Conditionally

```typescript
test('feature test', async ({ page }) => {
  const featureEnabled = await page.locator('.new-feature').isVisible().catch(() => false);
  
  if (!featureEnabled) {
    test.skip();
  }
  
  // ... test
});
```

### 5. Visual Regression Testing

```typescript
test('page visual check', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveScreenshot('dashboard.png', {
    threshold: 0.2,
  });
});
```

## CI Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: |
          cd backend
          npm ci
          
      - name: Run unit tests
        run: |
          cd backend
          npm run test:unit

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: muslimeen_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
          
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: |
          cd backend
          npm ci
          
      - name: Run migrations
        run: |
          cd backend
          npm run migrate
        env:
          DB_HOST: localhost
          DB_USER: postgres
          DB_PASSWORD: postgres
          DB_NAME: muslimeen_test
          
      - name: Run integration tests
        run: |
          cd backend
          npm run test:integration
        env:
          DB_HOST: localhost
          DB_USER: postgres
          DB_PASSWORD: postgres
          DB_NAME: muslimeen_test

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
        
      - name: Run E2E tests
        run: npm run test:e2e
        
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: |
            e2e/test-results/
            e2e/playwright-report/
```

## Troubleshooting

### Common Issues

#### Port Already in Use

```bash
# Kill process on port 3001 (backend)
npx kill-port 3001

# Or on Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

#### Database Connection Failed

```bash
# Check PostgreSQL is running
psql -U postgres -c "SELECT 1;"

# Create test database
psql -U postgres -c "CREATE DATABASE muslimeen_test;"
```

#### E2E Tests Timing Out

```bash
# Increase timeout
npx playwright test --timeout=60000

# Run with headed mode to see what's happening
npx playwright test --headed

# Debug specific test
npx playwright test auth.spec.ts --debug
```

#### Playwright Browsers Not Installed

```bash
# Install browsers
npx playwright install

# Install with dependencies (Linux)
npx playwright install --with-deps
```

### Debug Mode

Run tests with debug mode to see browser actions:

```bash
# Debug all tests
npx playwright test --debug

# Debug specific file
npx playwright test auth.spec.ts --debug

# Debug specific test
npx playwright test -g "user can login" --debug
```

### Viewing Test Reports

```bash
# Show HTML report
npx playwright show-report

# View traces
npx playwright show-trace test-results/trace.zip
```

## Environment Variables

### Required for Integration Tests

```env
# .env.test
NODE_ENV=test
DB_HOST=localhost
DB_PORT=5432
DB_NAME=muslimeen_test
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=test-jwt-secret-key-min-32-characters
JWT_EXPIRES_IN=1h
BCRYPT_ROUNDS=4
LOG_LEVEL=error
```

### Required for E2E Tests

```env
# .env (root)
PLAYWRIGHT_BASE_URL=http://localhost:8080
CI=true  # Set in CI environment
```

## Maintenance

### Updating Snapshots

```bash
# Update all snapshots
npx playwright test --update-snapshots

# Update specific file
npx playwright test auth.spec.ts --update-snapshots
```

### Cleaning Test Data

```bash
# Clean test database
psql -U postgres -d muslimeen_test -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Re-run migrations
npm run setup:test-db
```

---

For more information, see:
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
