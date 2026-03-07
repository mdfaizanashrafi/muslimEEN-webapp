/**
 * Create User Module
 * Handles creation of the application database user
 */

const { log } = require('../utils/logger');

/**
 * Create the application database user
 * @param {Object} config - Configuration object with appUser and appPassword
 * @param {Pool} adminPool - PostgreSQL pool connected to admin database
 * @returns {Promise<boolean>} - Success status
 */
async function createAppUser(config, adminPool) {
  try {
    await adminPool.query(`CREATE USER ${config.appUser} WITH PASSWORD '${config.appPassword}'`);
    log(`✓ User '${config.appUser}' created`);
    return true;
  } catch (err) {
    if (err.message.includes('already exists')) {
      log(`⚠ User '${config.appUser}' already exists`);
      return true;
    } else {
      throw err;
    }
  }
}

module.exports = { createAppUser };
