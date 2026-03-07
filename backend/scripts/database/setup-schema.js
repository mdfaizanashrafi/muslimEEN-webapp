/**
 * Setup Schema Module
 * Handles schema privileges configuration
 */

const { Pool } = require('pg');
const { log } = require('../utils/logger');

/**
 * Set up schema privileges for the application user
 * @param {Object} config - Configuration object with host, port, appDb, postgresUser, postgresPassword, appUser
 * @returns {Promise<void>}
 */
async function setupSchemaPrivileges(config) {
  const appPool = new Pool({
    host: config.host,
    port: config.port,
    database: config.appDb,
    user: config.postgresUser,
    password: config.postgresPassword,
  });

  try {
    await appPool.query(`GRANT ALL ON SCHEMA public TO ${config.appUser}`);
    await appPool.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${config.appUser}`);
    await appPool.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${config.appUser}`);
    log(`✓ Schema privileges configured`);
  } finally {
    await appPool.end();
  }
}

module.exports = { setupSchemaPrivileges };
