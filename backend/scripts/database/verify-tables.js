/**
 * Verify Tables Module
 * Handles verification of created database tables
 */

const { log } = require('../utils/logger');

/**
 * Verify tables were created in the database
 * @param {Pool} migrationPool - PostgreSQL pool connected to application database
 * @returns {Promise<number>} - Number of tables found
 */
async function verifyTables(migrationPool) {
  const tablesResult = await migrationPool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name
  `);

  log(`✓ Found ${tablesResult.rows.length} tables:`);
  tablesResult.rows.forEach(row => {
    log(`  - ${row.table_name}`);
  });

  return tablesResult.rows.length;
}

module.exports = { verifyTables };
