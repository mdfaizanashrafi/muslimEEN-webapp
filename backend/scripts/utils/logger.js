/**
 * Shared logging utilities for database scripts
 */

const { colors } = require('./colors');

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

module.exports = { log };
