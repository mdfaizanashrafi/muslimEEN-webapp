/**
 * Database Seeder
 * 
 * Run with: npm run seed
 * 
 * This script seeds the database with initial data including:
 * - First admin user
 * - Initial invite tokens
 * - Sample marketplace data (optional)
 */

const { Pool } = require('pg');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'muslimeen',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Password hashing using bcrypt (matches backend)
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
const hashPassword = async (password) => {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
};

// Admin details from env or defaults
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@muslimeen.space';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'Admin123!';
const ADMIN_FIRST_NAME = process.env.SEED_ADMIN_FIRST_NAME || 'Admin';
const ADMIN_LAST_NAME = process.env.SEED_ADMIN_LAST_NAME || 'User';

async function seedAdmin() {
  console.log('🌱 Seeding admin user...');
  
  const passwordHash = await hashPassword(ADMIN_PASSWORD);
  
  // Check if admin exists
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [ADMIN_EMAIL]);
  
  let adminId;
  if (existing.rows.length > 0) {
    // Update to admin with new password
    adminId = existing.rows[0].id;
    await pool.query(
      `UPDATE users 
       SET role = 'admin',
           verification_tier = 'advanced',
           trust_score = 1000,
           invites_remaining = 999999,
           is_active = true,
           password_hash = $2
       WHERE id = $1`,
      [adminId, passwordHash]
    );
    console.log(`  ✅ Updated existing user ${ADMIN_EMAIL} to admin with new password`);
  } else {
    // Create new admin
    const result = await pool.query(
      `INSERT INTO users (
        email, password_hash, first_name, last_name,
        role, verification_tier, trust_score, invites_remaining, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id`,
      [
        ADMIN_EMAIL,
        passwordHash,
        ADMIN_FIRST_NAME,
        ADMIN_LAST_NAME,
        'admin',
        'advanced',
        1000,
        999999,
        true
      ]
    );
    adminId = result.rows[0].id;
    console.log(`  ✅ Created admin user: ${ADMIN_EMAIL}`);
  }
  
  // Create invite tokens for admin
  for (let i = 0; i < 5; i++) {
    const token = crypto.randomBytes(32).toString('base64url');
    await pool.query(
      `INSERT INTO invites (token, created_by, status, expires_at, created_at)
       VALUES ($1, $2, 'pending', NOW() + INTERVAL '30 days', NOW())
       ON CONFLICT DO NOTHING`,
      [token, adminId]
    );
  }
  console.log(`  ✅ Created 5 invite tokens for admin`);
  
  return adminId;
}

async function seedMarketplaceCategories() {
  console.log('🌱 Seeding marketplace categories...');
  
  // This is a placeholder - add your marketplace seed data here
  console.log('  ⏭️  Skipped (optional)');
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║              MuslimEEN Database Seeder                     ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log();
  
  try {
    const adminId = await seedAdmin();
    await seedMarketplaceCategories();
    
    console.log();
    console.log('────────────────────────────────────────────────────────────');
    console.log('✅ Seeding completed successfully!');
    console.log();
    console.log('Admin Credentials:');
    console.log(`  Email:    ${ADMIN_EMAIL}`);
    console.log(`  Password: ${ADMIN_PASSWORD}`);
    console.log();
    console.log(`Admin ID: ${adminId}`);
    console.log('────────────────────────────────────────────────────────────');
    console.log();
    console.log('You can now log in at: http://localhost:8080/login');
    console.log();
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { seedAdmin };
