/**
 * Database Initialization Script
 * Creates database, user, and runs migrations using Node.js
 * This is an alternative to the PowerShell script
 * 
 * Refactored following Single Responsibility Principle (SRP)
 * Each step is now handled by a focused module in the database/ directory
 */

const { Pool } = require('pg');
const path = require('path');
const { log } = require('./utils/logger');

// Import focused modules
const { createDatabase } = require('./database/create-database');
const { createAppUser } = require('./database/create-user');
const { setupSchemaPrivileges } = require('./database/setup-schema');
const { enableExtensions } = require('./database/enable-extensions');
const { runMigrations } = require('./database/run-migrations');
const { verifyTables } = require('./database/verify-tables');
const { generateEnvFile } = require('./setup/generate-env');

// Configuration - modify these if needed
const config = {
  postgresUser: process.env.PG_USER || 'postgres',
  postgresPassword: process.env.PG_PASSWORD || '@Qwe@123',
  postgresDb: 'postgres', // Default database to connect to
  appDb: process.env.DB_NAME || 'muslimeen',
  appUser: process.env.DB_USER || 'muslimeen',
  appPassword: process.env.DB_PASSWORD || 'muslimeen123',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
};

async function initializeDatabase() {
  log('==============================================', 'green');
  log('  MuslimEEN Database Initialization', 'green');
  log('==============================================', 'green');
  log('');

  // Connect to default postgres database
  const adminPool = new Pool({
    host: config.host,
    port: config.port,
    database: config.postgresDb,
    user: config.postgresUser,
    password: config.postgresPassword,
  });

  try {
    // Step 1: Check connection
    log('Step 1: Checking PostgreSQL connection...', 'cyan');
    const result = await adminPool.query('SELECT version()');
    log(`✓ Connected to PostgreSQL`);
    log(`  ${result.rows[0].version.split('\n')[0]}`);
    log('');

    // Step 2: Create database
    log('Step 2: Creating database...', 'cyan');
    await createDatabase(config, adminPool);
    log('');

    // Step 3: Create user
    log('Step 3: Creating application user...', 'cyan');
    await createAppUser(config, adminPool);
    log('');

    // Step 4: Grant privileges
    log('Step 4: Granting privileges...', 'cyan');
    await adminPool.query(`GRANT ALL PRIVILEGES ON DATABASE ${config.appDb} TO ${config.appUser}`);
    log(`✓ Privileges granted`);
    log('');

    await adminPool.end();

    // Step 5: Connect to new database and set up schema
    log('Step 5: Setting up schema privileges...', 'cyan');
    await setupSchemaPrivileges(config);
    log('');

    // Step 6: Enable UUID extension
    log('Step 6: Enabling UUID extension...', 'cyan');
    await enableExtensions(config);
    log('');

    // Step 7: Run migrations
    log('Step 7: Running migrations...', 'cyan');
    const migrationPool = await runMigrations(config);
    log('');

    // Step 8: Verify tables
    log('Step 8: Verifying tables...', 'cyan');
    await verifyTables(migrationPool);
    log('');

    await migrationPool.end();

    // Step 9: Update .env file
    log('Step 9: Updating environment file...', 'cyan');
    const envPath = path.join(__dirname, '..', '.env');
    generateEnvFile(config, envPath);
    log('');

    // Success
    log('==============================================', 'green');
    log('  Database Setup Complete!', 'green');
    log('==============================================', 'green');
    log('');
    log('Database Configuration:', 'cyan');
    log(`  Database: ${config.appDb}`);
    log(`  Username: ${config.appUser}`);
    log(`  Password: ${config.appPassword}`);
    log(`  Host: ${config.host}:${config.port}`);
    log('');
    log('Next Steps:', 'cyan');
    log('  1. Start the backend server:', 'white');
    log('     npm run dev', 'yellow');
    log('');
    log('  2. Test the connection:', 'white');
    log('     node scripts/test-connection.js', 'yellow');
    log('');

    process.exit(0);

  } catch (error) {
    log('');
    log('==============================================', 'red');
    log('  Database Setup Failed!', 'red');
    log('==============================================', 'red');
    log('');
    log(`Error: ${error.message}`, 'red');
    log('');

    if (error.message.includes('password authentication')) {
      log('Troubleshooting:', 'yellow');
      log('  • Check if PostgreSQL is running', 'white');
      log('  • Verify the postgres password is correct', 'white');
      log('  • Try: SET PG_PASSWORD=yourpassword && node scripts/init-database.js', 'white');
    } else if (error.code === 'ECONNREFUSED') {
      log('Troubleshooting:', 'yellow');
      log('  • PostgreSQL service is not running', 'white');
      log('  • Start it with: net start postgresql-x64-15', 'white');
    } else if (error.message.includes('permission denied')) {
      log('Troubleshooting:', 'yellow');
      log('  • Run as administrator', 'white');
      log('  • Check PostgreSQL user permissions', 'white');
    }

    log('');
    process.exit(1);
  }
}

// Run
initializeDatabase();
