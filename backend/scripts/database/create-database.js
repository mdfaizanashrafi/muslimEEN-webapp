/**
 * Create Database Module
 * Handles creation of the application database
 */

const { log } = require('../utils/logger');

/**
 * Create the application database
 * @param {Object} config - Configuration object with appDb name
 * @param {Pool} adminPool - PostgreSQL pool connected to admin database
 * @returns {Promise<boolean>} - Success status
 */
async function createDatabase(config, adminPool) {
  try {
    await adminPool.query(`CREATE DATABASE ${config.appDb}`);
    log(`✓ Database '${config.appDb}' created`);
    return true;
  } catch (err) {
    if (err.message.includes('already exists')) {
      log(`⚠ Database '${config.appDb}' already exists`);
      return true;
    } else {
      throw err;
    }
  }
}

module.exports = { createDatabase };
