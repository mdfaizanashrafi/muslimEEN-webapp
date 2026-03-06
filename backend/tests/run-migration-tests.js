#!/usr/bin/env node

/**
 * Migration Test Runner
 * 
 * Usage:
 *   node tests/run-migration-tests.js [options]
 * 
 * Options:
 *   --legacy     Run tests with all feature flags disabled (legacy mode)
 *   --modular    Run tests with all feature flags enabled (modular mode)
 *   --verify     Run migration verification only
 *   --parity     Run parity tests only
 *   --all        Run all tests (default)
 */

const { execSync } = require('child_process');
const path = require('path');

const args = process.argv.slice(2);
const options = {
  legacy: args.includes('--legacy'),
  modular: args.includes('--modular'),
  verify: args.includes('--verify'),
  parity: args.includes('--parity'),
  all: args.includes('--all') || args.length === 0,
};

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, env = {}) {
  log(`\n> ${command}`, 'blue');
  try {
    execSync(command, {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
      env: { ...process.env, ...env },
    });
    return true;
  } catch (error) {
    return false;
  }
}

async function main() {
  log('\n========================================', 'blue');
  log('   MIGRATION TEST RUNNER', 'blue');
  log('========================================\n', 'blue');

  // Run migration verification
  if (options.verify || options.all) {
    log('Running migration verification...', 'yellow');
    
    // Import and run verification
    try {
      const { verifyMigration, printVerificationResults } = require('./utils/migrationVerifier');
      const results = await verifyMigration();
      printVerificationResults(results);
      
      const hasErrors = results.some(r => r.status === 'error');
      if (hasErrors) {
        log('\n❌ Migration verification failed!', 'red');
        process.exit(1);
      }
    } catch (error) {
      log(`\n❌ Verification error: ${error.message}`, 'red');
    }
  }

  // Run tests with legacy configuration
  if (options.legacy || options.all) {
    log('\n========================================', 'blue');
    log('   RUNNING TESTS: LEGACY MODE', 'blue');
    log('========================================', 'blue');
    
    const legacyEnv = {
      USE_MODULAR_IAM: 'false',
      USE_MODULAR_PROFILE: 'false',
      USE_MODULAR_TRUST: 'false',
      USE_MODULAR_NETWORK: 'false',
      USE_MODULAR_NOTIFICATIONS: 'false',
      USE_MODULAR_INVITATIONS: 'false',
      USE_MODULAR_MARKETPLACE: 'false',
      USE_MODULAR_ISLAMIC_FINANCE: 'false',
    };

    const success = runCommand(
      'npm test -- --testPathPattern="integration/migration|modules/\\w+\\.parity" --verbose',
      legacyEnv
    );

    if (!success) {
      log('\n❌ Legacy tests failed!', 'red');
      process.exit(1);
    }

    log('\n✅ Legacy tests passed!', 'green');
  }

  // Run tests with modular configuration
  if (options.modular || options.all) {
    log('\n========================================', 'blue');
    log('   RUNNING TESTS: MODULAR MODE', 'blue');
    log('========================================', 'blue');
    
    const modularEnv = {
      USE_MODULAR_IAM: 'true',
      USE_MODULAR_PROFILE: 'true',
      USE_MODULAR_TRUST: 'true',
      USE_MODULAR_NETWORK: 'true',
      USE_MODULAR_NOTIFICATIONS: 'true',
      USE_MODULAR_INVITATIONS: 'true',
      USE_MODULAR_MARKETPLACE: 'true',
      USE_MODULAR_ISLAMIC_FINANCE: 'true',
    };

    const success = runCommand(
      'npm test -- --testPathPattern="integration/migration|modules/\\w+\\.parity" --verbose',
      modularEnv
    );

    if (!success) {
      log('\n❌ Modular tests failed!', 'red');
      process.exit(1);
    }

    log('\n✅ Modular tests passed!', 'green');
  }

  // Run parity tests only
  if (options.parity) {
    log('\n========================================', 'blue');
    log('   RUNNING PARITY TESTS', 'blue');
    log('========================================', 'blue');

    const success = runCommand(
      'npm test -- --testPathPattern="parity" --verbose'
    );

    if (!success) {
      log('\n❌ Parity tests failed!', 'red');
      process.exit(1);
    }

    log('\n✅ Parity tests passed!', 'green');
  }

  log('\n========================================', 'green');
  log('   ALL TESTS PASSED! ✅', 'green');
  log('========================================\n', 'green');
}

main().catch(error => {
  log(`\n❌ Error: ${error.message}`, 'red');
  process.exit(1);
});
