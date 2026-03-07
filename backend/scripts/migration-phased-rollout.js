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

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ENV_FILE = path.join(__dirname, '../.env');
const ENV_EXAMPLE = path.join(__dirname, '../.env.example');

// Color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Module definitions with risk levels
const modules = {
  iam: {
    flag: 'USE_MODULAR_IAM',
    risk: 'low',
    description: 'Authentication & Identity',
    order: 1,
  },
  profile: {
    flag: 'USE_MODULAR_PROFILE',
    risk: 'low',
    description: 'User Profiles',
    order: 2,
  },
  trust: {
    flag: 'USE_MODULAR_TRUST',
    risk: 'medium',
    description: 'Trust Scores & Verification',
    order: 3,
  },
  network: {
    flag: 'USE_MODULAR_NETWORK',
    risk: 'medium',
    description: 'Network Connections',
    order: 4,
  },
  marketplace: {
    flag: 'USE_MODULAR_MARKETPLACE',
    risk: 'medium',
    description: 'Marketplace Listings',
    order: 5,
  },
  islamicFinance: {
    flag: 'USE_MODULAR_ISLAMIC_FINANCE',
    risk: 'medium',
    description: 'Islamic Finance Tools',
    order: 6,
  },
  invitations: {
    flag: 'USE_MODULAR_INVITATIONS',
    risk: 'low',
    description: 'Invitation Management',
    order: 7,
  },
  notifications: {
    flag: 'USE_MODULAR_NOTIFICATIONS',
    risk: 'high',
    description: 'Notification Delivery',
    order: 8,
  },
};

// Phase configurations
const phases = {
  phase0: {
    name: 'Verification',
    description: 'Verify migration readiness without enabling any modules',
    modules: {},
  },
  phase1: {
    name: 'Phase 1: Core Auth',
    description: 'Enable IAM module only (lowest risk)',
    modules: { iam: true },
  },
  phase2: {
    name: 'Phase 2: User Data',
    description: 'Enable Profile and Trust modules',
    modules: { iam: true, profile: true, trust: true },
  },
  phase3: {
    name: 'Phase 3: Social & Commerce',
    description: 'Enable Network and Marketplace',
    modules: { iam: true, profile: true, trust: true, network: true, marketplace: true },
  },
  phase4: {
    name: 'Phase 4: Finance & Invitations',
    description: 'Enable Islamic Finance and Invitations',
    modules: {
      iam: true, profile: true, trust: true, network: true, marketplace: true,
      islamicFinance: true, invitations: true,
    },
  },
  phase5: {
    name: 'Phase 5: Notifications',
    description: 'Enable Notifications (highest risk)',
    modules: {
      iam: true, profile: true, trust: true, network: true, marketplace: true,
      islamicFinance: true, invitations: true, notifications: true,
    },
  },
  full: {
    name: 'Full Migration',
    description: 'Enable all modules',
    modules: {
      iam: true, profile: true, trust: true, network: true, marketplace: true,
      islamicFinance: true, invitations: true, notifications: true,
    },
  },
  reset: {
    name: 'Reset to Legacy',
    description: 'Disable all modular implementations',
    modules: {
      iam: false, profile: false, trust: false, network: false, marketplace: false,
      islamicFinance: false, invitations: false, notifications: false,
    },
  },
};

function readEnvFile() {
  if (fs.existsSync(ENV_FILE)) {
    return fs.readFileSync(ENV_FILE, 'utf8');
  }
  if (fs.existsSync(ENV_EXAMPLE)) {
    return fs.readFileSync(ENV_EXAMPLE, 'utf8');
  }
  return '';
}

function writeEnvFile(content) {
  fs.writeFileSync(ENV_FILE, content, 'utf8');
}

function updateEnvFile(phaseConfig) {
  let envContent = readEnvFile();
  
  // Update each module flag
  for (const [moduleName, enabled] of Object.entries(phaseConfig.modules)) {
    const flag = modules[moduleName].flag;
    const value = enabled ? 'true' : 'false';
    
    // Check if flag exists in file
    const flagRegex = new RegExp(`^${flag}=.*$`, 'm');
    
    if (flagRegex.test(envContent)) {
      // Update existing flag
      envContent = envContent.replace(flagRegex, `${flag}=${value}`);
    } else {
      // Add new flag
      envContent += `\n${flag}=${value}`;
    }
  }
  
  writeEnvFile(envContent);
}

function getCurrentStatus() {
  const envContent = readEnvFile();
  const status = {};
  
  for (const [moduleName, config] of Object.entries(modules)) {
    const flagRegex = new RegExp(`^${config.flag}=(true|false)$`, 'm');
    const match = envContent.match(flagRegex);
    status[moduleName] = match ? match[1] === 'true' : false;
  }
  
  return status;
}

function printStatus() {
  const status = getCurrentStatus();
  
  log('\n========================================', 'blue');
  log('   CURRENT MIGRATION STATUS', 'blue');
  log('========================================\n', 'blue');
  
  for (const [moduleName, config] of Object.entries(modules)) {
    const enabled = status[moduleName];
    const symbol = enabled ? '✅' : '⬜';
    const color = enabled ? 'green' : 'reset';
    log(`${symbol} ${config.description} (${moduleName})`, color);
  }
  
  const enabledCount = Object.values(status).filter(v => v).length;
  const totalCount = Object.keys(modules).length;
  
  log('\n----------------------------------------', 'blue');
  log(`Progress: ${enabledCount}/${totalCount} modules enabled`, enabledCount === totalCount ? 'green' : 'yellow');
  log('========================================\n', 'blue');
}

function printPhaseInfo(phaseKey) {
  const phase = phases[phaseKey];
  if (!phase) return;
  
  log(`\n========================================`, 'cyan');
  log(`   ${phase.name}`, 'cyan');
  log(`========================================\n`, 'cyan');
  log(`${phase.description}\n`);
  
  if (phaseKey !== 'phase0' && phaseKey !== 'reset') {
    log('Modules to enable:');
    for (const [moduleName, enabled] of Object.entries(phase.modules)) {
      if (enabled) {
        const config = modules[moduleName];
        const riskColor = config.risk === 'low' ? 'green' : config.risk === 'medium' ? 'yellow' : 'red';
        log(`  ✅ ${config.description} (Risk: ${config.risk})`, riskColor);
      }
    }
    
    log('\nModules staying disabled:');
    for (const [moduleName, enabled] of Object.entries(phase.modules)) {
      if (!enabled) {
        const config = modules[moduleName];
        log(`  ⬜ ${config.description}`, 'reset');
      }
    }
  }
  
  log('');
}

function runTests() {
  log('\nRunning migration tests...\n', 'blue');
  try {
    execSync('npm test -- --testPathPattern="migration|parity" --silent', {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
    });
    log('\n✅ All tests passed!', 'green');
    return true;
  } catch (error) {
    log('\n❌ Some tests failed', 'red');
    return false;
  }
}

function verifyMigration() {
  log('\nVerifying migration readiness...\n', 'blue');
  try {
    execSync('node tests/run-migration-tests.js --verify', {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
    });
    return true;
  } catch (error) {
    return false;
  }
}

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
  
  printPhaseInfo(phase);
  
  if (phase === 'phase0') {
    // Verification only
    printStatus();
    const verified = verifyMigration();
    process.exit(verified ? 0 : 1);
  }
  
  if (phase === 'reset') {
    log('⚠️  This will disable all modular implementations!', 'red');
    log('All traffic will go to legacy code.\n', 'yellow');
  }
  
  // Update environment
  log('Updating environment variables...', 'blue');
  updateEnvFile(phases[phase]);
  log('✅ Environment updated\n', 'green');
  
  // Print new status
  printStatus();
  
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
