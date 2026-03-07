/**
 * Database Connection Test Script
 * Tests connectivity to PostgreSQL and verifies setup
 */

require('dotenv').config();
const db = require('../src/config/database');

async function testConnection() {
  console.log('==============================================');
  console.log('  MuslimEEN Database Connection Test');
  console.log('==============================================');
  console.log();

  try {
    // Test 1: Basic connectivity
    console.log('Test 1: Testing basic connectivity...');
    const result = await db.query('SELECT NOW() as current_time');
    console.log('✓ Connected to PostgreSQL');
    console.log(`  Server Time: ${result.rows[0].current_time}`);
    console.log();

    // Test 2: Check database
    console.log('Test 2: Checking database...');
    const dbResult = await db.query('SELECT current_database() as database');
    console.log(`✓ Database: ${dbResult.rows[0].database}`);
    console.log();

    // Test 3: List tables
    console.log('Test 3: Checking tables...');
    const tablesResult = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    if (tablesResult.rows.length === 0) {
      console.log('⚠ No tables found. Run migrations first:');
      console.log('  psql -U postgres -d muslimeen -f database/migrations/001_initial_schema.sql');
    } else {
      console.log(`✓ Found ${tablesResult.rows.length} tables:`);
      tablesResult.rows.forEach(row => {
        console.log(`  - ${row.table_name}`);
      });
    }
    console.log();

    // Test 4: Check UUID extension
    console.log('Test 4: Checking UUID extension...');
    const uuidResult = await db.query("SELECT * FROM pg_extension WHERE extname = 'uuid-ossp'");
    if (uuidResult.rows.length > 0) {
      console.log('✓ UUID extension enabled');
    } else {
      console.log('⚠ UUID extension not found. Run:');
      console.log("  CREATE EXTENSION IF NOT EXISTS 'uuid-ossp';");
    }
    console.log();

    console.log('==============================================');
    console.log('  All tests passed!');
    console.log('==============================================');
    console.log();
    console.log('Your database is ready. Start the server with:');
    console.log('  npm run dev');
    
    process.exit(0);
  } catch (error) {
    console.error('✗ Connection failed');
    console.error();
    console.error('Error:', error.message);
    console.error();
    
    if (error.message.includes('password authentication')) {
      console.log('Troubleshooting:');
      console.log('  1. Check your .env file has correct DB_PASSWORD');
      console.log('  2. Verify PostgreSQL is running');
      console.log('  3. Try resetting the password in pgAdmin');
    } else if (error.message.includes('database') && error.message.includes('does not exist')) {
      console.log('Troubleshooting:');
      console.log('  1. Create the database:');
      console.log('     CREATE DATABASE muslimeen;');
      console.log('  2. Run the setup script:');
      console.log('     .\setup-database.ps1');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('Troubleshooting:');
      console.log('  1. Start PostgreSQL service:');
      console.log('     net start postgresql-x64-15');
      console.log('  2. Check if PostgreSQL is installed');
    }
    
    process.exit(1);
  }
}

testConnection();
