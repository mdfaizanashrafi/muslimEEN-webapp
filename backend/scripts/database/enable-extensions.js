/**
 * Enable Extensions Module
 * Handles enabling PostgreSQL extensions
 */

const { Pool } = require('pg');
const { log } = require('../utils/logger');

/**
 * Enable required PostgreSQL extensions
 * @param {Object} config - Configuration object with host, port, appDb, postgresUser, postgresPassword
 * @returns {Promise<void>}
 */
async function enableExtensions(config) {
  const appPool = new Pool({
    host: config.host,
    port: config.port,
    database: config.appDb,
    user: config.postgresUser,
    password: config.postgresPassword,
  });

  try {
    await appPool.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    log(`✓ UUID extension enabled`);
  } finally {
    await appPool.end();
  }
}

module.exports = { enableExtensions };
