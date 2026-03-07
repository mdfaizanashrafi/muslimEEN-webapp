/**
 * Run Migrations Module
 * Handles database migration execution
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const { log } = require('../utils/logger');

/**
 * Run database migrations
 * @param {Object} config - Configuration object with host, port, appDb, postgresUser, postgresPassword
 * @returns {Promise<Pool>} - Migration pool for further operations
 */
async function runMigrations(config) {
  const migrationPool = new Pool({
    host: config.host,
    port: config.port,
    database: config.appDb,
    user: config.postgresUser,
    password: config.postgresPassword,
  });

  const migrationPath = path.join(__dirname, '..', '..', 'database', 'migrations', '001_initial_schema.sql');

  if (!fs.existsSync(migrationPath)) {
    throw new Error(`Migration file not found: ${migrationPath}`);
  }

  const migrationSql = fs.readFileSync(migrationPath, 'utf8');

  // Split by semicolon but be careful with function definitions
  const statements = migrationSql
    .split(/;\s*$/m)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (const statement of statements) {
    try {
      await migrationPool.query(statement + ';');
    } catch (err) {
      // Ignore "already exists" errors
      if (!err.message.includes('already exists')) {
        throw err;
      }
    }
  }

  log(`✓ Migrations completed`);

  return migrationPool;
}

module.exports = { runMigrations };
