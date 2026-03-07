/**
 * Test runner
 * Handles running migration tests and verification
 */

const path = require('path');
const { execSync } = require('child_process');
const { log } = require('../utils/colors');

const BACKEND_DIR = path.join(__dirname, '../..');

/**
 * Run migration and parity tests
 * @returns {boolean} True if all tests passed, false otherwise
 */
function runTests() {
  log('\nRunning migration tests...\n', 'blue');
  try {
    execSync('npm test -- --testPathPattern="migration|parity" --silent', {
      stdio: 'inherit',
      cwd: BACKEND_DIR,
    });
    log('\n✅ All tests passed!', 'green');
    return true;
  } catch (error) {
    log('\n❌ Some tests failed', 'red');
    return false;
  }
}

/**
 * Verify migration readiness
 * @returns {boolean} True if verification passed, false otherwise
 */
function verifyMigration() {
  log('\nVerifying migration readiness...\n', 'blue');
  try {
    execSync('node tests/run-migration-tests.js --verify', {
      stdio: 'inherit',
      cwd: BACKEND_DIR,
    });
    return true;
  } catch (error) {
    return false;
  }
}

module.exports = {
  runTests,
  verifyMigration,
};
