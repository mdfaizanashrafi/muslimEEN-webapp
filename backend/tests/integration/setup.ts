/**
 * Integration Test Setup
 * Database and app initialization for integration tests
 */

import { Pool, Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: path.join(__dirname, '../../.env.test') });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-for-integration-tests-only-min-32-chars';
process.env.JWT_EXPIRES_IN = '1h';
process.env.BCRYPT_ROUNDS = '4'; // Faster hashing for tests
process.env.LOG_LEVEL = 'error'; // Reduce noise during tests
process.env.DB_NAME = 'muslimeen_test';

// Import app after setting environment variables
import app from '../../src/server';

// Test database configuration
const testPool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: 'muslimeen_test',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '@Qwe@123',
});

// Admin pool for database creation (connects to postgres database)
const adminPool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: 'postgres',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '@Qwe@123',
});

/**
 * Run database migrations
 */
async function runMigrations(): Promise<void> {
  const migrationPath = path.join(__dirname, '../../database/migrations/001_initial_schema.sql');
  
  if (!fs.existsSync(migrationPath)) {
    console.warn(`Migration file not found: ${migrationPath}`);
    return;
  }

  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
  
  // Split migration into individual statements
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const statement of statements) {
    try {
      await testPool.query(statement + ';');
    } catch (error: any) {
      // Ignore errors for existing objects (like CREATE EXTENSION IF NOT EXISTS)
      if (!error.message?.includes('already exists')) {
        console.error(`Migration error: ${error.message}`);
      }
    }
  }
}

/**
 * Seed test data
 */
async function seedTestData(): Promise<void> {
  // Seed a valid invitation code
  await testPool.query(`
    INSERT INTO invitations (code, invitee_email, status, expires_at)
    VALUES ('VALID123', 'test@example.com', 'pending', NOW() + INTERVAL '30 days')
    ON CONFLICT (code) DO NOTHING;
  `);

  // Seed test users with known passwords (hashed as 'password123')
  const testUsers = [
    {
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'muslim_verified',
      trustScore: 500,
    },
    {
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'muslim_verified',
      trustScore: 1000,
    },
    {
      email: 'unverified@example.com',
      firstName: 'Unverified',
      lastName: 'User',
      role: 'muslim_unverified',
      trustScore: 100,
    },
  ];

  // Note: In real tests, you'd hash passwords properly
  // This is a simplified bcrypt hash for 'password123' with 4 rounds
  const testPasswordHash = '$2b$04$test.hash.for.password123.test.hash.for.';

  for (const user of testUsers) {
    await testPool.query(`
      INSERT INTO users (email, password_hash, first_name, last_name, role, trust_score, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (email) DO NOTHING;
    `, [user.email, testPasswordHash, user.firstName, user.lastName, user.role, user.trustScore]);
  }
}

/**
 * Clear all test data
 */
async function clearTestData(): Promise<void> {
  const tables = [
    'qard_hasan_lenders',
    'qard_hasan_loans',
    'donations',
    'sadaqah_campaigns',
    'messages',
    'notifications',
    'marketplace_items',
    'verification_witnesses',
    'connections',
    'invitation_outcomes',
    'invitations',
    'trust_score_history',
    'education',
    'work_history',
    'refresh_tokens',
    'waqf',
    'users',
  ];

  for (const table of tables) {
    try {
      await testPool.query(`TRUNCATE TABLE ${table} CASCADE;`);
    } catch (error) {
      // Table might not exist, ignore
    }
  }
}

// Setup test database before all tests
beforeAll(async () => {
  try {
    // Create test database if it doesn't exist
    const dbExists = await adminPool.query(
      "SELECT 1 FROM pg_database WHERE datname = 'muslimeen_test'"
    );

    if (dbExists.rowCount === 0) {
      await adminPool.query('CREATE DATABASE muslimeen_test');
      console.log('Created test database: muslimeen_test');
    }

    // Run migrations
    await runMigrations();

    // Seed test data
    await seedTestData();

    console.log('Integration test setup complete');
  } catch (error) {
    console.error('Test setup failed:', error);
    throw error;
  }
}, 60000); // 60 second timeout for setup

// Cleanup after all tests
afterAll(async () => {
  try {
    await clearTestData();
    await testPool.end();
    await adminPool.end();
    console.log('Integration test cleanup complete');
  } catch (error) {
    console.error('Test cleanup error:', error);
  }
}, 30000);

// Reset database between tests
afterEach(async () => {
  try {
    await clearTestData();
    await seedTestData();
  } catch (error) {
    console.error('Test reset error:', error);
  }
});

export { testPool, app };
