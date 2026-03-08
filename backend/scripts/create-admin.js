#!/usr/bin/env node
/**
 * Admin Bootstrap Script (JavaScript)
 * 
 * Creates the first admin user for the MuslimEEN platform.
 * Run: node scripts/create-admin.js
 */

const { Pool } = require('pg');
const crypto = require('crypto');
const readline = require('readline');
require('dotenv').config();

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'muslimeen',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

// Password hashing
const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
};

// Prompt helper
const prompt = (question) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
};

// Create admin user
const createAdminUser = async ({ email, password, firstName, lastName }) => {
  const passwordHash = hashPassword(password);

  const result = await pool.query(
    `INSERT INTO users (
      email, password_hash, first_name, last_name,
      role, verification_tier, trust_score, invites_remaining, is_active, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
    ON CONFLICT (email) DO UPDATE SET
      role = 'admin',
      verification_tier = 'advanced',
      trust_score = 1000,
      invites_remaining = 999999,
      is_active = true
    RETURNING id, email`,
    [
      email.toLowerCase(),
      passwordHash,
      firstName,
      lastName,
      'admin',
      'advanced',
      1000,
      999999,
      true,
    ]
  );

  return result.rows[0].id;
};

// Main
const main = async () => {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║       MuslimEEN Admin Bootstrap - First User Setup         ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log();

  try {
    // Check for existing admins
    const existingAdmins = await pool.query(
      "SELECT COUNT(*) FROM users WHERE role = 'admin' OR role = 'super_admin'"
    );
    const adminCount = parseInt(existingAdmins.rows[0].count, 10);

    if (adminCount > 0) {
      console.log(`⚠️  ${adminCount} admin(s) already exist.`);
      const proceed = await prompt('Create another admin? (yes/no): ');
      if (proceed.toLowerCase() !== 'yes' && proceed.toLowerCase() !== 'y') {
        console.log('Aborted.');
        process.exit(0);
      }
    }

    // Get details from env or prompt
    let email = process.env.ADMIN_EMAIL || '';
    let password = process.env.ADMIN_PASSWORD || '';
    let firstName = process.env.ADMIN_FIRST_NAME || '';
    let lastName = process.env.ADMIN_LAST_NAME || '';

    if (!email) email = await prompt('Enter your email: ');
    if (!email.includes('@')) {
      console.error('❌ Invalid email');
      process.exit(1);
    }

    if (!password) password = await prompt('Enter password (min 8 chars): ');
    if (password.length < 8) {
      console.error('❌ Password too short');
      process.exit(1);
    }

    if (!firstName) firstName = await prompt('Enter first name: ');
    if (!lastName) lastName = await prompt('Enter last name: ');

    console.log('\nCreating admin user...');
    const userId = await createAdminUser({ email, password, firstName, lastName });

    // Create invite tokens
    for (let i = 0; i < 3; i++) {
      const token = crypto.randomBytes(32).toString('base64url');
      await pool.query(
        `INSERT INTO invites (token, created_by, status, expires_at, created_at)
         VALUES ($1, $2, 'pending', NOW() + INTERVAL '30 days', NOW())
         ON CONFLICT DO NOTHING`,
        [token, userId]
      );
    }

    console.log('\n✅ Admin user created successfully!');
    console.log('\n────────────────────────────────────────────────────────────');
    console.log('User ID:', userId);
    console.log('Email:', email);
    console.log('Role: admin');
    console.log('Invites: Unlimited (+ 3 tokens created)');
    console.log('────────────────────────────────────────────────────────────');
    console.log('\n🌐 Login at: http://localhost:8080/login');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

main();
