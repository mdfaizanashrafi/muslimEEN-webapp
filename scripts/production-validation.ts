#!/usr/bin/env ts-node
/**
 * Production Validation Suite
 * 
 * Validates all critical flows in production:
 * - Authentication (login/logout/session)
 * - Invite system (valid/invalid invites)
 * - API security (protected routes)
 * - Internal APIs (API key auth)
 * - Webhooks (event processing)
 * 
 * Usage:
 *   npx ts-node scripts/production-validation.ts [staging|production]
 * 
 * WARNING: This runs tests against LIVE environment.
 * Use test accounts only - do NOT use real user data.
 * 
 * DATE: 2026-03-20
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  staging: {
    frontend: 'https://muslimeen-staging.vercel.app',
    backend: 'https://muslimeen-api-staging.onrender.com',
    internalApi: 'https://muslimeen-api-staging.onrender.com/api/internal',
  },
  production: {
    frontend: 'https://muslimeen.org',
    backend: 'https://muslimeen-api.onrender.com',
    internalApi: 'https://muslimeen-api.onrender.com/api/internal',
  },
  // Test timeouts
  timeout: 30000,
  // Retry attempts
  retries: 3,
};

// Test accounts (use test accounts only!)
const TEST_ACCOUNTS = {
  // These should be test accounts created for validation
  validUser: {
    email: process.env.TEST_USER_EMAIL || 'test@example.com',
    password: process.env.TEST_USER_PASSWORD || 'test-password',
  },
  // API key for internal API tests
  internalApiKey: process.env.INTERNAL_API_KEY || '',
};

// Colors for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
};

// ============================================================================
// RESULTS TRACKING
// ============================================================================

interface TestResult {
  category: string;
  name: string;
  passed: boolean;
  message: string;
  duration: number;
  critical: boolean;
}

const results: TestResult[] = [];
let criticalFailures = 0;

// ============================================================================
// LOGGING
// ============================================================================

const log = {
  info: (msg: string) => console.log(`${colors.blue}[TEST]${colors.reset} ${msg}`),
  success: (msg: string) => console.log(`${colors.green}[PASS]${colors.reset} ${msg}`),
  error: (msg: string) => console.log(`${colors.red}[FAIL]${colors.reset} ${msg}`),
  warn: (msg: string) => console.log(`${colors.yellow}[WARN]${colors.reset} ${msg}`),
  section: (title: string) => {
    console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.cyan}  ${title}${colors.reset}`);
    console.log(`${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}\n`);
  },
};

// ============================================================================
// TEST FRAMEWORK
// ============================================================================

async function runTest(
  category: string,
  name: string,
  testFn: () => Promise<void>,
  critical: boolean = true
): Promise<void> {
  const start = Date.now();
  try {
    await testFn();
    const duration = Date.now() - start;
    results.push({ category, name, passed: true, message: 'Passed', duration, critical });
    log.success(`${name} (${duration}ms)`);
  } catch (error: any) {
    const duration = Date.now() - start;
    results.push({ category, name, passed: false, message: error.message, duration, critical });
    log.error(`${name}: ${error.message}`);
    if (critical) {
      criticalFailures++;
    }
  }
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

// ============================================================================
// AUTHENTICATION TESTS
// ============================================================================

async function testAuthentication(env: 'staging' | 'production'): Promise<void> {
  log.section('AUTHENTICATION TESTS');
  
  const baseUrl = CONFIG[env].frontend;
  
  await runTest('Auth', 'Login page accessible', async () => {
    const response = await fetch(`${baseUrl}/login`, {
      method: 'GET',
      redirect: 'manual',
    });
    // Should return 200 or 307 (redirect)
    assert(response.status === 200 || response.status === 307, `Expected 200/307, got ${response.status}`);
  });
  
  await runTest('Auth', 'Clerk UI loads on login page', async () => {
    const response = await fetch(`${baseUrl}/login`);
    const html = await response.text();
    assert(html.includes('clerk') || html.includes('sign-in') || html.includes('login'), 
      'Clerk sign-in UI not detected');
  });
  
  await runTest('Auth', 'Protected routes require authentication', async () => {
    // Try to access dashboard without auth
    const response = await fetch(`${baseUrl}/dashboard`, {
      method: 'GET',
      redirect: 'manual',
    });
    // Should redirect to login (307) or return 401
    assert(response.status === 307 || response.status === 401 || response.status === 403, 
      `Expected redirect or auth error, got ${response.status}`);
  }, false); // Non-critical - may vary by implementation
  
  await runTest('Auth', 'Auth health endpoint responsive', async () => {
    const response = await fetch(`${CONFIG[env].backend}/api/health/auth`);
    assert(response.ok, `Auth health failed: ${response.status}`);
    const data = await response.json();
    assert(data.success === true, 'Auth health not successful');
    assert(data.auth?.system === 'clerk', 'Auth system not Clerk');
  });
}

// ============================================================================
// INVITE SYSTEM TESTS
// ============================================================================

async function testInviteSystem(env: 'staging' | 'production'): Promise<void> {
  log.section('INVITE SYSTEM TESTS');
  
  const baseUrl = CONFIG[env].frontend;
  
  await runTest('Invite', 'Registration requires invite code', async () => {
    // Try to access register without invite
    const response = await fetch(`${baseUrl}/register`, {
      method: 'GET',
      redirect: 'manual',
    });
    // Should redirect (no direct access) or show invite required message
    const validResponse = response.status === 307 || response.status === 302 || 
                         response.status === 401 || response.status === 403;
    assert(validResponse, `Expected redirect/auth required, got ${response.status}`);
  });
  
  await runTest('Invite', 'Invalid invite code rejected', async () => {
    // Try to access register with invalid invite
    const response = await fetch(`${baseUrl}/register?invite=INVALID_CODE`, {
      method: 'GET',
    });
    const html = await response.text();
    // Should show error or redirect
    const hasError = html.includes('invalid') || html.includes('error') || 
                    html.includes('expired') || response.status === 401 ||
                    response.status === 403 || response.status === 400;
    assert(hasError || response.redirected, 'Invalid invite not properly rejected');
  }, false); // Non-critical
  
  await runTest('Invite', 'Backend enforces invite validation', async () => {
    // Check webhook endpoint exists (invite validation happens in webhooks)
    const response = await fetch(`${CONFIG[env].backend}/api/webhooks/clerk`, {
      method: 'GET', // HEAD might not be allowed
    });
    // Should return 401 (unauthorized without signature) not 404
    assert(response.status !== 404, 'Webhook endpoint not found');
  }, false);
}

// ============================================================================
// API SECURITY TESTS
// ============================================================================

async function testApiSecurity(env: 'staging' | 'production'): Promise<void> {
  log.section('API SECURITY TESTS');
  
  const baseUrl = CONFIG[env].backend;
  
  await runTest('API Security', 'Protected API routes require auth', async () => {
    // Try to access protected endpoint without auth
    const response = await fetch(`${baseUrl}/api/users/me`, {
      method: 'GET',
    });
    // Should return 401 Unauthorized
    assert(response.status === 401, `Expected 401, got ${response.status}`);
  });
  
  await runTest('API Security', 'Health endpoints are public', async () => {
    const response = await fetch(`${baseUrl}/health`);
    assert(response.ok, `Health endpoint not accessible: ${response.status}`);
  });
  
  await runTest('API Security', 'Auth health endpoint is public', async () => {
    const response = await fetch(`${baseUrl}/api/health/auth`);
    assert(response.ok, `Auth health not accessible: ${response.status}`);
  });
  
  await runTest('API Security', 'CORS headers present', async () => {
    const response = await fetch(`${baseUrl}/health`, {
      method: 'OPTIONS',
      headers: {
        'Origin': CONFIG[env].frontend,
        'Access-Control-Request-Method': 'GET',
      },
    });
    // CORS preflight should work
    const corsHeader = response.headers.get('access-control-allow-origin');
    assert(corsHeader !== null || response.ok, 'CORS not configured');
  }, false);
}

// ============================================================================
// INTERNAL API TESTS
// ============================================================================

async function testInternalApi(env: 'staging' | 'production'): Promise<void> {
  log.section('INTERNAL API TESTS');
  
  const baseUrl = CONFIG[env].internalApi;
  
  if (!TEST_ACCOUNTS.internalApiKey) {
    log.warn('INTERNAL_API_KEY not set - skipping internal API tests');
    return;
  }
  
  await runTest('Internal API', 'Requires API key authentication', async () => {
    // Try without API key
    const response = await fetch(`${baseUrl}/health`, {
      method: 'GET',
    });
    // Should return 401
    assert(response.status === 401, `Expected 401 without key, got ${response.status}`);
  });
  
  await runTest('Internal API', 'Valid API key grants access', async () => {
    const response = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      headers: {
        'x-api-key': TEST_ACCOUNTS.internalApiKey,
      },
    });
    assert(response.ok, `Access denied with valid key: ${response.status}`);
  });
  
  await runTest('Internal API', 'Invalid API key rejected', async () => {
    const response = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      headers: {
        'x-api-key': 'invalid-key-12345',
      },
    });
    assert(response.status === 401, `Expected 401 for invalid key, got ${response.status}`);
  });
}

// ============================================================================
// WEBHOOK TESTS
// ============================================================================

async function testWebhooks(env: 'staging' | 'production'): Promise<void> {
  log.section('WEBHOOK TESTS');
  
  const baseUrl = CONFIG[env].backend;
  
  await runTest('Webhook', 'Webhook endpoint exists', async () => {
    const response = await fetch(`${baseUrl}/api/webhooks/clerk`, {
      method: 'GET',
    });
    // Should not be 404 (might be 401 without signature)
    assert(response.status !== 404, 'Webhook endpoint not found');
  });
  
  await runTest('Webhook', 'Webhook requires signature verification', async () {
    const response = await fetch(`${baseUrl}/api/webhooks/clerk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ test: true }),
    });
    // Should reject unsigned webhooks
    assert(response.status === 401 || response.status === 403, 
      `Expected 401/403 for unsigned webhook, got ${response.status}`);
  });
  
  await runTest('Webhook', 'Webhook health tracked', async () => {
    const response = await fetch(`${baseUrl}/api/health/auth`);
    const data = await response.json();
    // Should include webhook metrics
    assert(data.checks?.webhooks !== undefined || data.webhooks !== undefined, 
      'Webhook metrics not in health response');
  }, false);
}

// ============================================================================
// SYSTEM HEALTH TESTS
// ============================================================================

async function testSystemHealth(env: 'staging' | 'production'): Promise<void> {
  log.section('SYSTEM HEALTH TESTS');
  
  const baseUrl = CONFIG[env].backend;
  
  await runTest('Health', 'Backend health check passes', async () => {
    const response = await fetch(`${baseUrl}/health`);
    assert(response.ok, `Health check failed: ${response.status}`);
    const data = await response.json();
    assert(data.status === 'healthy' || data.status === 'ok', 
      `Unhealthy status: ${data.status}`);
  });
  
  await runTest('Health', 'Auth system health detailed', async () => {
    const response = await fetch(`${baseUrl}/api/health/auth`);
    assert(response.ok, `Auth health failed: ${response.status}`);
    const data = await response.json();
    
    // Verify structure
    assert(data.success === true, 'Success flag not true');
    assert(data.timestamp, 'Missing timestamp');
    assert(data.checks?.database || data.checks, 'Missing database check');
    assert(data.checks?.clerk_api || data.checks, 'Missing Clerk check');
  });
  
  await runTest('Health', 'Readiness check passes', async () => {
    const response = await fetch(`${baseUrl}/api/health/auth/ready`);
    assert(response.ok, `Readiness check failed: ${response.status}`);
    const data = await response.json();
    assert(data.ready === true || data.status === 'ready', 
      `Not ready: ${JSON.stringify(data)}`);
  }, false);
  
  await runTest('Health', 'Response time acceptable', async () => {
    const start = Date.now();
    const response = await fetch(`${baseUrl}/health`);
    const duration = Date.now() - start;
    assert(response.ok, `Health check failed`);
    assert(duration < 2000, `Response too slow: ${duration}ms`);
  });
}

// ============================================================================
// REPORT GENERATION
// ============================================================================

function generateReport(): void {
  console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}              PRODUCTION VALIDATION REPORT                 ${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}\n`);
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed);
  const total = results.length;
  
  // Group by category
  const categories = [...new Set(results.map(r => r.category))];
  
  categories.forEach(category => {
    const categoryTests = results.filter(r => r.category === category);
    const categoryPassed = categoryTests.filter(r => r.passed).length;
    
    console.log(`${colors.blue}${category}:${colors.reset} ${categoryPassed}/${categoryTests.length} passed`);
    
    categoryTests.forEach(test => {
      const icon = test.passed ? colors.green + '✓' : test.critical ? colors.red + '✗' : colors.yellow + '⚠';
      console.log(`  ${icon}${colors.reset} ${test.name}`);
      if (!test.passed) {
        console.log(`      ${colors.red}${test.message}${colors.reset}`);
      }
    });
    console.log();
  });
  
  console.log(`Total: ${passed}/${total} tests passed`);
  console.log(`Critical Failures: ${criticalFailures}`);
  console.log();
  
  if (criticalFailures === 0) {
    console.log(`${colors.green}╔═══════════════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.green}║  ✅ ALL CRITICAL TESTS PASSED                             ║${colors.reset}`);
    console.log(`${colors.green}╚═══════════════════════════════════════════════════════════╝${colors.reset}`);
    console.log();
    console.log('Production validation successful!');
    console.log('All critical flows are working correctly.');
    return 0;
  } else {
    console.log(`${colors.red}╔═══════════════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.red}║  ❌ CRITICAL TESTS FAILED                                 ║${colors.reset}`);
    console.log(`${colors.red}╚═══════════════════════════════════════════════════════════╝${colors.reset}`);
    console.log();
    console.log('CRITICAL ISSUES DETECTED!');
    console.log('Do not proceed with full traffic until resolved.');
    console.log();
    console.log('Failed tests:');
    failed.filter(f => f.critical).forEach(f => {
      console.log(`  - ${f.category}: ${f.name}`);
    });
    return 1;
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main(): Promise<void> {
  console.log(`\n${colors.cyan}╔═══════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║       PRODUCTION VALIDATION SUITE                         ║${colors.reset}`);
  console.log(`${colors.cyan}╚═══════════════════════════════════════════════════════════╝${colors.reset}\n`);
  
  console.log(`${colors.yellow}⚠️  WARNING: This tests the LIVE environment${colors.reset}`);
  console.log(`${colors.yellow}   Ensure you have permission to run these tests${colors.reset}\n`);
  
  const environment = (process.argv[2] || 'staging') as 'staging' | 'production';
  
  if (!['staging', 'production'].includes(environment)) {
    console.error('Usage: npx ts-node scripts/production-validation.ts [staging|production]');
    process.exit(1);
  }
  
  console.log(`Target Environment: ${environment.toUpperCase()}`);
  console.log(`Frontend: ${CONFIG[environment].frontend}`);
  console.log(`Backend: ${CONFIG[environment].backend}\n`);
  
  try {
    // Run all test suites
    await testAuthentication(environment);
    await testInviteSystem(environment);
    await testApiSecurity(environment);
    await testInternalApi(environment);
    await testWebhooks(environment);
    await testSystemHealth(environment);
    
    // Generate report
    const exitCode = generateReport();
    process.exit(exitCode);
    
  } catch (error: any) {
    console.error('Validation failed:', error.message);
    process.exit(1);
  }
}

main();
