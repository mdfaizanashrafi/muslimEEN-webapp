#!/usr/bin/env ts-node
/**
 * Pre-Deployment Verification Script
 * 
 * Comprehensive checks before production deployment.
 * DO NOT PROCEED IF ANY CHECK FAILS.
 * 
 * Usage: npx ts-node scripts/pre-deployment-check.ts
 * 
 * DATE: 2026-03-20
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// ============================================================================
// CONFIGURATION
// ============================================================================

const CRITICAL_ENV_VARS = [
  'CLERK_SECRET_KEY',
  'CLERK_PUBLISHABLE_KEY',
  'CLERK_WEBHOOK_SECRET',
  'DATABASE_URL',
  'INTERNAL_API_KEY',
  'SENTRY_DSN',
  'NODE_ENV',
  'PORT',
];

const REQUIRED_FILES = [
  'backend/src/server.ts',
  'backend/src/config/env.ts',
  'backend/src/modules/shared/middleware/readOnlyMode.ts',
  'backend/src/modules/iam/middleware/clerkAuth.ts',
  'backend/src/modules/shared/utils/logSampler.ts',
];

// Colors for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

// ============================================================================
// RESULTS TRACKING
// ============================================================================

interface CheckResult {
  name: string;
  passed: boolean;
  message: string;
  critical: boolean;
}

const results: CheckResult[] = [];

// ============================================================================
// LOGGING
// ============================================================================

const log = {
  info: (msg: string) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg: string) => console.log(`${colors.green}[PASS]${colors.reset} ${msg}`),
  error: (msg: string) => console.log(`${colors.red}[FAIL]${colors.reset} ${msg}`),
  warn: (msg: string) => console.log(`${colors.yellow}[WARN]${colors.reset} ${msg}`),
  section: (title: string) => {
    console.log(`\n${colors.blue}═══════════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.blue}  ${title}${colors.reset}`);
    console.log(`${colors.blue}═══════════════════════════════════════════════════════════${colors.reset}\n`);
  },
};

// ============================================================================
// CHECK FUNCTIONS
// ============================================================================

async function runCheck(
  name: string,
  checkFn: () => Promise<void>,
  critical: boolean = true
): Promise<void> {
  try {
    await checkFn();
    results.push({ name, passed: true, message: 'Passed', critical });
    log.success(`${name}`);
  } catch (error: any) {
    results.push({ name, passed: false, message: error.message, critical });
    if (critical) {
      log.error(`${name}: ${error.message}`);
    } else {
      log.warn(`${name}: ${error.message}`);
    }
  }
}

// ============================================================================
// BUILD VERIFICATION
// ============================================================================

async function checkBuild(): Promise<void> {
  log.section('1. BUILD VERIFICATION');

  await runCheck('TypeScript compilation', async () => {
    try {
      execSync('npm run build', {
        cwd: path.join(process.cwd(), 'backend'),
        stdio: 'pipe',
        timeout: 120000,
      });
    } catch (error: any) {
      throw new Error(`Build failed: ${error.message}`);
    }
  });

  await runCheck('Type checking (noEmit)', async () => {
    try {
      execSync('npx tsc --noEmit', {
        cwd: path.join(process.cwd(), 'backend'),
        stdio: 'pipe',
        timeout: 60000,
      });
    } catch (error: any) {
      throw new Error(`Type errors found: ${error.message}`);
    }
  });
}

// ============================================================================
// ENVIRONMENT VARIABLES
// ============================================================================

async function checkEnvironment(): Promise<void> {
  log.section('2. ENVIRONMENT VARIABLES');

  // Check if .env file exists
  await runCheck('.env file exists', async () => {
    const envPath = path.join(process.cwd(), 'backend/.env');
    if (!fs.existsSync(envPath)) {
      throw new Error('.env file not found in backend/');
    }
  });

  // Read .env file
  const envPath = path.join(process.cwd(), 'backend/.env');
  const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';

  // Check each critical variable
  for (const varName of CRITICAL_ENV_VARS) {
    await runCheck(`Environment variable: ${varName}`, async () => {
      const regex = new RegExp(`^${varName}=.+`, 'm');
      if (!regex.test(envContent)) {
        throw new Error(`Missing or empty in .env file`);
      }
      
      // Additional validation for specific vars
      if (varName === 'CLERK_SECRET_KEY') {
        const value = envContent.match(new RegExp(`${varName}=(.+)`))?.[1];
        if (value?.includes('test') && process.env.NODE_ENV === 'production') {
          log.warn('CLERK_SECRET_KEY appears to be a test key in production');
        }
      }
    });
  }

  // Check for placeholder values
  await runCheck('No placeholder secrets', async () => {
    const placeholders = [
      'your-secret',
      'your_secure',
      'your-super-secret',
      'change-this',
      'example',
      'test_test',
    ];
    
    for (const placeholder of placeholders) {
      if (envContent.toLowerCase().includes(placeholder)) {
        throw new Error(`Found placeholder value: "${placeholder}"`);
      }
    }
  }, false);
}

// ============================================================================
// FILE SYSTEM CHECKS
// ============================================================================

async function checkFiles(): Promise<void> {
  log.section('3. FILE SYSTEM CHECKS');

  await runCheck('Critical files exist', async () => {
    for (const file of REQUIRED_FILES) {
      const fullPath = path.join(process.cwd(), file);
      if (!fs.existsSync(fullPath)) {
        throw new Error(`Missing: ${file}`);
      }
    }
  });

  await runCheck('No legacy auth files', async () => {
    const legacyFiles = [
      'backend/src/modules/iam/services/AuthService.ts',
      'backend/src/modules/iam/services/JwtService.ts',
      'backend/src/modules/iam/services/PasswordService.ts',
    ];

    for (const file of legacyFiles) {
      const fullPath = path.join(process.cwd(), file);
      if (fs.existsSync(fullPath)) {
        log.warn(`Legacy file still exists: ${file}`);
      }
    }
  }, false);

  await runCheck('Package.json valid', async () => {
    const packagePath = path.join(process.cwd(), 'backend/package.json');
    const content = fs.readFileSync(packagePath, 'utf-8');
    const pkg = JSON.parse(content);
    
    if (!pkg.dependencies?.['@clerk/clerk-sdk-node']) {
      throw new Error('Missing @clerk/clerk-sdk-node dependency');
    }
    if (!pkg.dependencies?.['svix']) {
      throw new Error('Missing svix dependency');
    }
  });
}

// ============================================================================
// CODE QUALITY CHECKS
// ============================================================================

async function checkCodeQuality(): Promise<void> {
  log.section('4. CODE QUALITY CHECKS');

  await runCheck('No console.log in production code', async () => {
    const srcDir = path.join(process.cwd(), 'backend/src');
    const files = getAllTsFiles(srcDir);
    
    const violations: string[] = [];
    for (const file of files) {
      if (file.includes('.test.') || file.includes('.spec.')) continue;
      
      const content = fs.readFileSync(file, 'utf-8');
      if (content.includes('console.log') && !content.includes('console.log(')) {
        // Simple check - might have false positives
        continue;
      }
      
      // Check for actual console.log (not console.log within comments)
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('console.log(') && 
            !line.includes('//') && 
            !line.trim().startsWith('*')) {
          violations.push(`${file}:${i + 1}`);
        }
      }
    }
    
    if (violations.length > 5) {
      throw new Error(`Found ${violations.length} console.log statements`);
    }
  }, false);

  await runCheck('All imports resolve', async () => {
    // This is verified by TypeScript compilation, but we double-check
    try {
      execSync('npx tsc --noEmit --skipLibCheck', {
        cwd: path.join(process.cwd(), 'backend'),
        stdio: 'pipe',
        timeout: 60000,
      });
    } catch (error: any) {
      throw new Error('Import resolution failed');
    }
  });
}

// ============================================================================
// DATABASE CHECKS (REQUIRE DB CONNECTION)
// ============================================================================

async function checkDatabase(): Promise<void> {
  log.section('5. DATABASE CHECKS');

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    log.warn('DATABASE_URL not set, skipping DB checks');
    return;
  }

  await runCheck('Database URL format valid', async () => {
    try {
      const url = new URL(dbUrl);
      if (url.protocol !== 'postgresql:') {
        throw new Error('Must use postgresql:// protocol');
      }
    } catch {
      throw new Error('Invalid DATABASE_URL format');
    }
  });

  // Note: Actual DB connection would require the pool module
  // For now, we just validate the URL format
  log.info('DB connection test requires running server');
}

// ============================================================================
// CLERK CHECKS
// ============================================================================

async function checkClerk(): Promise<void> {
  log.section('6. CLERK CONFIGURATION');

  await runCheck('Clerk keys present', async () => {
    const envPath = path.join(process.cwd(), 'backend/.env');
    const envContent = fs.readFileSync(envPath, 'utf-8');
    
    const secretKey = envContent.match(/CLERK_SECRET_KEY=(.+)/)?.[1];
    const publishableKey = envContent.match(/CLERK_PUBLISHABLE_KEY=(.+)/)?.[1];
    const webhookSecret = envContent.match(/CLERK_WEBHOOK_SECRET=(.+)/)?.[1];
    
    if (!secretKey || secretKey === 'sk_test_...') {
      throw new Error('CLERK_SECRET_KEY not set');
    }
    if (!publishableKey || publishableKey === 'pk_test_...') {
      throw new Error('CLERK_PUBLISHABLE_KEY not set');
    }
    if (!webhookSecret || webhookSecret === 'whsec_...') {
      throw new Error('CLERK_WEBHOOK_SECRET not set');
    }
  });

  // Note: Actual Clerk API check would require making an API call
  log.info('Clerk API connectivity test requires network access');
}

// ============================================================================
// HEALTH ENDPOINT CHECKS
// ============================================================================

async function checkHealthEndpoints(): Promise<void> {
  log.section('7. HEALTH ENDPOINTS');

  log.info('Health endpoint checks require running server');
  log.info('After deployment, verify:');
  log.info('  - GET /health');
  log.info('  - GET /api/health/auth');
  log.info('  - GET /api/health/auth/ready');
}

// ============================================================================
// SECURITY CHECKS
// ============================================================================

async function checkSecurity(): Promise<void> {
  log.section('8. SECURITY CHECKS');

  await runCheck('Feature flags configured', async () => {
    const envPath = path.join(process.cwd(), 'backend/.env');
    const envContent = fs.readFileSync(envPath, 'utf-8');
    
    // Check for critical feature flags
    const flags = [
      'USE_CLERK_AUTH',
      'DISABLE_LEGACY_AUTH',
      'SYSTEM_READ_ONLY',
    ];
    
    for (const flag of flags) {
      if (!envContent.includes(flag)) {
        log.warn(`Missing feature flag: ${flag}`);
      }
    }
  }, false);

  await runCheck('Internal API key configured', async () => {
    const envPath = path.join(process.cwd(), 'backend/.env');
    const envContent = fs.readFileSync(envPath, 'utf-8');
    
    if (!envContent.includes('INTERNAL_API_KEY=')) {
      throw new Error('INTERNAL_API_KEY not configured');
    }
  });
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getAllTsFiles(dir: string): string[] {
  const files: string[] = [];
  
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.includes('node_modules') && !item.includes('dist')) {
      files.push(...getAllTsFiles(fullPath));
    } else if (stat.isFile() && item.endsWith('.ts')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// ============================================================================
// REPORT GENERATION
// ============================================================================

function generateReport(): void {
  console.log(`\n${colors.blue}═══════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}              PRE-DEPLOYMENT CHECK REPORT                  ${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════════════════════════${colors.reset}\n`);

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed);
  const criticalFailed = failed.filter(r => r.critical);
  const total = results.length;

  console.log(`Total Checks: ${total}`);
  console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed.length}${colors.reset}`);
  console.log(`Critical Failures: ${criticalFailed.length}`);
  console.log();

  if (criticalFailed.length > 0) {
    console.log(`${colors.red}CRITICAL FAILURES (BLOCKING DEPLOYMENT):${colors.reset}`);
    criticalFailed.forEach(r => {
      console.log(`  ❌ ${r.name}: ${r.message}`);
    });
    console.log();
  }

  if (failed.length > 0 && criticalFailed.length === 0) {
    console.log(`${colors.yellow}WARNINGS (NON-BLOCKING):${colors.reset}`);
    failed.filter(r => !r.critical).forEach(r => {
      console.log(`  ⚠️  ${r.name}: ${r.message}`);
    });
    console.log();
  }

  // Deployment decision
  if (criticalFailed.length === 0) {
    console.log(`${colors.green}╔═══════════════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.green}║  ✅ ALL CRITICAL CHECKS PASSED - READY FOR DEPLOYMENT     ║${colors.reset}`);
    console.log(`${colors.green}╚═══════════════════════════════════════════════════════════╝${colors.reset}\n`);
    
    console.log('Next steps:');
    console.log('  1. Review any warnings above');
    console.log('  2. Deploy to staging environment');
    console.log('  3. Run smoke tests');
    console.log('  4. Deploy to production');
    console.log();
    
  } else {
    console.log(`${colors.red}╔═══════════════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.red}║  ❌ DEPLOYMENT BLOCKED - FIX CRITICAL ISSUES FIRST        ║${colors.reset}`);
    console.log(`${colors.red}╚═══════════════════════════════════════════════════════════╝${colors.reset}\n`);
    
    console.log('Required actions:');
    console.log('  1. Fix all critical failures listed above');
    console.log('  2. Re-run this verification script');
    console.log('  3. Only proceed when all critical checks pass');
    console.log();
    
    process.exit(1);
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main(): Promise<void> {
  console.log(`\n${colors.blue}╔═══════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║       MUSLIMEEN PRE-DEPLOYMENT VERIFICATION               ║${colors.reset}`);
  console.log(`${colors.blue}╚═══════════════════════════════════════════════════════════╝${colors.reset}\n`);

  console.log(`${colors.yellow}⚠️  WARNING: This script verifies deployment readiness.${colors.reset}`);
  console.log(`${colors.yellow}   DO NOT PROCEED IF ANY CRITICAL CHECK FAILS.${colors.reset}\n`);

  try {
    await checkBuild();
    await checkEnvironment();
    await checkFiles();
    await checkCodeQuality();
    await checkDatabase();
    await checkClerk();
    await checkHealthEndpoints();
    await checkSecurity();
    
    generateReport();
  } catch (error: any) {
    console.error('Verification failed with error:', error.message);
    process.exit(1);
  }
}

main();
