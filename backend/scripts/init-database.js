/**
 * Database Initialization Script
 * Creates database, user, and runs migrations using Node.js
 * This is an alternative to the PowerShell script
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

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

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function createDatabase() {
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
    try {
      await adminPool.query(`CREATE DATABASE ${config.appDb}`);
      log(`✓ Database '${config.appDb}' created`);
    } catch (err) {
      if (err.message.includes('already exists')) {
        log(`⚠ Database '${config.appDb}' already exists`);
      } else {
        throw err;
      }
    }
    log('');

    // Step 3: Create user
    log('Step 3: Creating application user...', 'cyan');
    try {
      await adminPool.query(`CREATE USER ${config.appUser} WITH PASSWORD '${config.appPassword}'`);
      log(`✓ User '${config.appUser}' created`);
    } catch (err) {
      if (err.message.includes('already exists')) {
        log(`⚠ User '${config.appUser}' already exists`);
      } else {
        throw err;
      }
    }
    log('');

    // Step 4: Grant privileges
    log('Step 4: Granting privileges...', 'cyan');
    await adminPool.query(`GRANT ALL PRIVILEGES ON DATABASE ${config.appDb} TO ${config.appUser}`);
    log(`✓ Privileges granted`);
    log('');

    await adminPool.end();

    // Step 5: Connect to new database and set up schema
    log('Step 5: Setting up schema privileges...', 'cyan');
    const appPool = new Pool({
      host: config.host,
      port: config.port,
      database: config.appDb,
      user: config.postgresUser,
      password: config.postgresPassword,
    });

    await appPool.query(`GRANT ALL ON SCHEMA public TO ${config.appUser}`);
    await appPool.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${config.appUser}`);
    await appPool.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${config.appUser}`);
    log(`✓ Schema privileges configured`);
    log('');

    // Step 6: Enable UUID extension
    log('Step 6: Enabling UUID extension...', 'cyan');
    await appPool.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    log(`✓ UUID extension enabled`);
    log('');

    await appPool.end();

    // Step 7: Run migrations
    log('Step 7: Running migrations...', 'cyan');
    const migrationPool = new Pool({
      host: config.host,
      port: config.port,
      database: config.appDb,
      user: config.postgresUser,
      password: config.postgresPassword,
    });

    const migrationPath = path.join(__dirname, '..', 'database', 'migrations', '001_initial_schema.sql');
    
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
    log('');

    // Step 8: Verify tables
    log('Step 8: Verifying tables...', 'cyan');
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
    log('');

    await migrationPool.end();

    // Step 9: Update .env file
    log('Step 9: Updating environment file...', 'cyan');
    const envPath = path.join(__dirname, '..', '.env');
    const envContent = `# MuslimEEN Backend Environment Configuration
# Local Development - Auto-generated

# Server Configuration
NODE_ENV=development
PORT=3001

# Database Configuration
DB_HOST=${config.host}
DB_PORT=${config.port}
DB_NAME=${config.appDb}
DB_USER=${config.appUser}
DB_PASSWORD=${config.appPassword}

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-for-development-only-${Date.now()}
JWT_EXPIRES_IN=24h

# Security
BCRYPT_ROUNDS=12
CSRF_SECRET=dev-csrf-secret-${Date.now()}

# Logging
LOG_LEVEL=info

# CORS
FRONTEND_URL=http://localhost:8080

# Admin Configuration
ADMIN_EMAIL=admin@muslimeen.org
`;

    fs.writeFileSync(envPath, envContent);
    log(`✓ Environment file updated: ${envPath}`);
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
createDatabase();
