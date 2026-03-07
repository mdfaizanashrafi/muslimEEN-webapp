/**
 * Status reporter
 * Handles getting and printing migration status
 */

const { log } = require('../utils/colors');

/**
 * Get current migration status from environment file
 * @param {Object} modules - The module definitions
 * @param {Function} readEnvFile - Function to read env file content
 * @returns {Object} Status object with module names as keys and boolean values
 */
function getCurrentStatus(modules, readEnvFile) {
  const envContent = readEnvFile();
  const status = {};
  
  for (const [moduleName, config] of Object.entries(modules)) {
    const flagRegex = new RegExp(`^${config.flag}=(true|false)$`, 'm');
    const match = envContent.match(flagRegex);
    status[moduleName] = match ? match[1] === 'true' : false;
  }
  
  return status;
}

/**
 * Print the current migration status
 * @param {Object} modules - The module definitions
 * @param {Function} readEnvFile - Function to read env file content
 */
function printStatus(modules, readEnvFile) {
  const status = getCurrentStatus(modules, readEnvFile);
  
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

/**
 * Print phase information
 * @param {string} phaseKey - The phase key (e.g., 'phase1', 'full')
 * @param {Object} phases - The phase configurations
 * @param {Object} modules - The module definitions
 */
function printPhaseInfo(phaseKey, phases, modules) {
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

module.exports = {
  getCurrentStatus,
  printStatus,
  printPhaseInfo,
};
