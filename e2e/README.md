# MuslimEEN E2E Tests

End-to-end testing for MuslimEEN using Playwright.

## Quick Start

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install

# Run all E2E tests
npm run test:e2e

# Run with UI mode (interactive)
npm run test:e2e:ui

# Run specific test file
npx playwright test auth.spec.ts

# Run in specific browser
npx playwright test --project=chromium
```

## Test Structure

```
e2e/
├── playwright.config.ts      # Playwright configuration
├── tests/
│   ├── auth.spec.ts         # Authentication flows
│   ├── profile.spec.ts      # Profile management
│   ├── dashboard.spec.ts    # Dashboard functionality
│   ├── marketplace.spec.ts  # Marketplace browsing
│   └── islamic-finance.spec.ts  # Islamic finance tools
└── test-results/            # Test output (gitignored)
```

## Configuration

The `playwright.config.ts` file configures:

- **Browsers**: Chromium, Firefox, Mobile Chrome, Mobile Safari
- **Base URL**: `http://localhost:8080` (configurable via `PLAYWRIGHT_BASE_URL`)
- **Parallel execution**: Enabled locally, disabled in CI
- **Retries**: 2 retries in CI, 0 locally
- **Web server**: Automatically starts `npm run dev:all`

## Environment Variables

```bash
# Set custom base URL
PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test

# Run in CI mode
CI=true npx playwright test
```

## Writing Tests

See the main [Testing Guide](../docs/TESTING.md) for detailed instructions on writing E2E tests.

### Example Test

```typescript
import { test, expect } from '@playwright/test';

test('user can login', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');
});
```

## Debugging

```bash
# Debug mode
npx playwright test --debug

# Headed mode (see browser)
npx playwright test --headed

# View trace
npx playwright show-trace test-results/trace.zip

# Open HTML report
npx playwright show-report
```

## Best Practices

1. Use `data-testid` attributes for reliable element selection
2. Set up test state in `beforeEach` hooks
3. Use unique test data to avoid conflicts
4. Clean up after tests when necessary
5. Handle flaky operations with proper waits
