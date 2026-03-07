#!/usr/bin/env node

/**
 * Phased Migration Rollout Script
 * 
 * This script helps with the gradual rollout of modular implementations.
 * 
 * Usage:
 *   node scripts/migration-phased-rollout.js [phase]
 * 
 * Phases:
 *   phase0  - Verification only (default)
 *   phase1  - Enable IAM (lowest risk)
 *   phase2  - Enable Profile + Trust
 *   phase3  - Enable Network + Marketplace
 *   phase4  - Enable Islamic Finance + Invitations
 *   phase5  - Enable Notifications (highest risk)
 *   full    - Enable all modules
 *   reset   - Disable all modules (back to legacy)
 * 
 * Examples:
 *   node scripts/migration-phased-rollout.js phase0
 *   node scripts/migration-phased-rollout.js phase1
 *   node scripts/migration-phased-rollout.js full
 */

const { log } = require('./utils/colors');
const { modules, phases } = require('./migration/config');
const { readEnvFile, updateEnvFile } = require('./migration/env-manager');
const { printStatus, printPhaseInfo } = require('./migration/status-reporter');
const { verifyMigration } = require('./migration/test-runner');

async function main() {
  const phase = process.argv[2] || 'phase0';
  
  if (!phases[phase]) {
    log(`\n❌ Unknown phase: ${phase}`, 'red');
    log('\nAvailable phases:', 'yellow');
    for (const [key, config] of Object.entries(phases)) {
      log(`  ${key.padEnd(8)} - ${config.description}`, 'yellow');
    }
    log('');
    process.exit(1);
  }
  
  printPhaseInfo(phase, phases, modules);
  
  if (phase === 'phase0') {
    // Verification only
    printStatus(modules, readEnvFile);
    const verified = verifyMigration();
    process.exit(verified ? 0 : 1);
  }
  
  if (phase === 'reset') {
    log('⚠️  This will disable all modular implementations!', 'red');
    log('All traffic will go to legacy code.\n', 'yellow');
  }
  
  // Update environment
  log('Updating environment variables...', 'blue');
  updateEnvFile(phases[phase], modules);
  log('✅ Environment updated\n', 'green');
  
  // Print new status
  printStatus(modules, readEnvFile);
  
  // Run verification
  if (phase !== 'reset') {
    const verified = verifyMigration();
    if (!verified) {
      log('\n⚠️  Migration verification failed!', 'red');
      log('Please check the errors above before proceeding.', 'yellow');
      process.exit(1);
    }
    
    // Optionally run tests
    log('\nWould you like to run the test suite? (y/n)', 'cyan');
    // In a real interactive script, we'd wait for user input
    // For now, we'll just provide instructions
    log('Run: npm test -- --testPathPattern="migration|parity"', 'cyan');
  }
  
  log(`\n✅ Phase ${phase} configuration applied!`, 'green');
  log('\nNext steps:', 'blue');
  log('  1. Restart your server to apply changes', 'yellow');
  log('  2. Monitor logs for any errors', 'yellow');
  log('  3. Run tests to verify functionality', 'yellow');
  if (phase !== 'full' && phase !== 'reset') {
    log(`  4. When ready, proceed to next phase: node scripts/migration-phased-rollout.js phase${parseInt(phase.replace('phase', '')) + 1}`, 'yellow');
  }
  log('');
}

main().catch(error => {
  log(`\n❌ Error: ${error.message}`, 'red');
  process.exit(1);
});
