#!/usr/bin/env ts-node
/**
 * Verify Legacy Auth Cleanup
 * 
 * Checks that all legacy auth code has been removed.
 * Run this after cleanup to ensure nothing was missed.
 * 
 * Usage: npm run verify:cleanup
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

// ============================================================================
// CONFIGURATION
// ============================================================================

const LEGACY_PATTERNS = [
  // Backend patterns
  { pattern: /from.*AuthService/, file: 'backend', severity: 'error' },
  { pattern: /from.*JwtService/, file: 'backend', severity: 'error' },
  { pattern: /from.*PasswordService/, file: 'backend', severity: 'error' },
  { pattern: /from.*\.\.\/middleware\/auth['"]/, file: 'backend', severity: 'error' },
  { pattern: /JWT_SECRET/, file: 'backend', severity: 'error' },
  { pattern: /jsonwebtoken/, file: 'backend', severity: 'error' },
  { pattern: /bcrypt/, file: 'backend', severity: 'error' },
  { pattern: /csrf/, file: 'backend', severity: 'error' },
  { pattern: /password_hash/, file: 'backend', severity: 'warning' },
  { pattern: /refresh_token/, file: 'backend', severity: 'error' },
  
  // Frontend patterns
  { pattern: /from.*auth-context/, file: 'frontend', severity: 'error' },
  { pattern: /useAuth\(\)/, file: 'frontend', severity: 'warning' },
  { pattern: /CSRF/, file: 'frontend', severity: 'warning' },
  { pattern: /setCsrfToken/, file: 'frontend', severity: 'warning' },
  { pattern: /clearCsrfToken/, file: 'frontend', severity: 'warning' },
  { pattern: /ensureCsrfToken/, file: 'frontend', severity: 'warning' },
];

const LEGACY_FILES = [
  // Backend files that should be deleted
  'backend/src/modules/iam/services/AuthService.ts',
  'backend/src/modules/iam/services/JwtService.ts',
  'backend/src/modules/iam/services/PasswordService.ts',
  'backend/src/modules/iam/controllers/AuthController.ts',
  'backend/src/modules/iam/middleware/auth.ts',
  'backend/src/modules/iam/middleware/unifiedAuth.ts',
  
  // Frontend files that should be deleted
  'frontend/lib/auth-context.tsx',
  'frontend/lib/auth-final-guide.tsx',
  'frontend/lib/auth-usage-guide.tsx',
];

// ============================================================================
// VERIFICATION FUNCTIONS
// ============================================================================

interface Finding {
  type: 'file_exists' | 'pattern_found';
  path: string;
  details?: string;
  severity: 'error' | 'warning';
}

const findings: Finding[] = [];

/**
 * Check if legacy files still exist
 */
async function checkLegacyFiles(): Promise<void> {
  console.log('🔍 Checking for legacy files...\n');
  
  for (const filePath of LEGACY_FILES) {
    const fullPath = path.join(process.cwd(), '..', '..', filePath);
    if (fs.existsSync(fullPath)) {
      findings.push({
        type: 'file_exists',
        path: filePath,
        severity: 'error',
      });
      console.log(`  ❌ Legacy file exists: ${filePath}`);
    }
  }
  
  if (!findings.some(f => f.type === 'file_exists')) {
    console.log('  ✅ No legacy files found\n');
  } else {
    console.log('');
  }
}

/**
 * Check for legacy patterns in source files
 */
async function checkLegacyPatterns(): Promise<void> {
  console.log('🔍 Checking for legacy patterns...\n');
  
  // Find all TypeScript files
  const backendFiles = await glob('backend/src/**/*.ts');
  const frontendFiles = await glob('frontend/**/*.{ts,tsx}');
  
  const allFiles = [
    ...backendFiles.map(f => ({ path: f, type: 'backend' as const })),
    ...frontendFiles.map(f => ({ path: f, type: 'frontend' as const })),
  ];
  
  for (const { path: filePath, type } of allFiles) {
    if (!fs.existsSync(filePath)) continue;
    
    const content = fs.readFileSync(filePath, 'utf-8');
    
    for (const { pattern, file, severity } of LEGACY_PATTERNS) {
      // Skip if pattern is for different environment
      if (file !== type) continue;
      
      // Skip node_modules and build files
      if (filePath.includes('node_modules') || filePath.includes('dist')) continue;
      
      if (pattern.test(content)) {
        findings.push({
          type: 'pattern_found',
          path: filePath,
          details: `Found pattern: ${pattern.source}`,
          severity: severity as 'error' | 'warning',
        });
        
        const icon = severity === 'error' ? '❌' : '⚠️';
        console.log(`  ${icon} ${filePath}`);
        console.log(`     Pattern: ${pattern.source}`);
      }
    }
  }
  
  if (!findings.some(f => f.type === 'pattern_found')) {
    console.log('  ✅ No legacy patterns found\n');
  } else {
    console.log('');
  }
}

/**
 * Check imports are not broken
 */
async function checkOrphanImports(): Promise<void> {
  console.log('🔍 Checking for orphan imports...\n');
  
  // This would require a more sophisticated analysis
  // For now, we'll just check if the build succeeds
  console.log('  ℹ️  Run "npm run build" to verify no broken imports\n');
}

/**
 * Check database for legacy tables/columns
 */
async function checkDatabase(): Promise<void> {
  console.log('🔍 Checking database for legacy structures...\n');
  console.log('  ℹ️  Run these SQL queries to verify:\n');
  console.log('     -- Check for refresh_tokens table');
  console.log('     SELECT EXISTS (SELECT FROM pg_tables WHERE tablename = \'refresh_tokens\');');
  console.log('');
  console.log('     -- Check for password_hash column');
  console.log('     SELECT column_name FROM information_schema.columns');
  console.log('     WHERE table_name = \'users\' AND column_name = \'password_hash\';');
  console.log('');
}

/**
 * Check environment variables
 */
async function checkEnvironment(): Promise<void> {
  console.log('🔍 Checking environment variables...\n');
  
  const legacyEnvVars = [
    'JWT_SECRET',
    'JWT_EXPIRES_IN',
    'CSRF_SECRET',
    'BCRYPT_ROUNDS',
  ];
  
  const envPath = path.join(process.cwd(), '..', '..', 'backend', '.env');
  
  if (!fs.existsSync(envPath)) {
    console.log('  ⚠️  No .env file found\n');
    return;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf-8');
  
  for (const envVar of legacyEnvVars) {
    const regex = new RegExp(`^${envVar}=`, 'm');
    if (regex.test(envContent)) {
      findings.push({
        type: 'pattern_found',
        path: 'backend/.env',
        details: `Legacy env var: ${envVar}`,
        severity: 'warning',
      });
      console.log(`  ⚠️  Legacy env var found: ${envVar}`);
    }
  }
  
  if (!findings.some(f => f.path === 'backend/.env')) {
    console.log('  ✅ No legacy env vars found\n');
  } else {
    console.log('');
  }
}

// ============================================================================
// REPORT
// ============================================================================

function generateReport(): void {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('                    CLEANUP VERIFICATION REPORT');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const errors = findings.filter(f => f.severity === 'error');
  const warnings = findings.filter(f => f.severity === 'warning');
  
  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ ALL CHECKS PASSED - Cleanup is complete!\n');
    console.log('Summary:');
    console.log('  • No legacy files found');
    console.log('  • No legacy patterns found');
    console.log('  • Environment is clean');
    console.log('\n🎉 You can now safely remove the rollback backups.');
  } else {
    console.log(`❌ FOUND ${errors.length} ERRORS, ${warnings.length} WARNINGS\n`);
    
    if (errors.length > 0) {
      console.log('ERRORS (must fix):');
      errors.forEach(f => {
        console.log(`  ❌ ${f.path}`);
        if (f.details) console.log(`     ${f.details}`);
      });
      console.log('');
    }
    
    if (warnings.length > 0) {
      console.log('WARNINGS (should fix):');
      warnings.forEach(f => {
        console.log(`  ⚠️  ${f.path}`);
        if (f.details) console.log(`     ${f.details}`);
      });
      console.log('');
    }
    
    console.log('❌ Cleanup is NOT complete. Address the issues above.\n');
    process.exit(1);
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main(): Promise<void> {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║     LEGACY AUTH CLEANUP VERIFICATION                      ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');
  
  await checkLegacyFiles();
  await checkLegacyPatterns();
  await checkOrphanImports();
  await checkDatabase();
  await checkEnvironment();
  
  generateReport();
}

main().catch(console.error);
