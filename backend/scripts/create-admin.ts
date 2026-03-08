#!/usr/bin/env ts-node
/**
 * Admin Bootstrap Script
 * 
 * Creates the first admin user for the MuslimEEN platform.
 * Run this script to initialize the system with an admin account.
 * 
 * Usage:
 *   npm run create-admin
 * 
 * Or with environment variables:
 *   ADMIN_EMAIL=your@email.com ADMIN_PASSWORD=yourpassword npm run create-admin
 */

import * as readline from 'readline';
import * as crypto from 'crypto';
import pool from '../src/modules/database/pool';

// ============================================================================
// PASSWORD HASHING
// ============================================================================

const hashPassword = (password: string): string => {
  // Using simple hash for bootstrap - production uses bcrypt
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
};

// ============================================================================
// USER INPUT
// ============================================================================

const prompt = (question: string): Promise<string> => {
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

// ============================================================================
// ADMIN CREATION
// ============================================================================

interface CreateAdminInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

const createAdminUser = async (input: CreateAdminInput): Promise<string> => {
  const { email, password, firstName, lastName } = input;

  // Hash password
  const passwordHash = hashPassword(password);

  // Insert admin user
  const result = await pool.query(
    `INSERT INTO users (
      email,
      password_hash,
      first_name,
      last_name,
      role,
      verification_tier,
      trust_score,
      invites_remaining,
      is_active,
      created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
    ON CONFLICT (email) DO UPDATE SET
      role = 'admin',
      invites_remaining = 999999,
      is_active = true
    RETURNING id, email`,
    [
      email.toLowerCase(),
      passwordHash,
      firstName,
      lastName,
      'admin',           // role
      'advanced',        // verification_tier
      1000,              // trust_score
      999999,            // invites_remaining (unlimited)
      true,              // is_active
    ]
  );

  return result.rows[0].id;
};

// ============================================================================
// MAIN
// ============================================================================

const main = async (): Promise<void> => {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║       MuslimEEN Admin Bootstrap - First User Setup         ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log();

  try {
    // Check if admin already exists
    const existingAdmins = await pool.query(
      "SELECT COUNT(*) FROM users WHERE role = 'admin' OR role = 'super_admin'"
    );
    const adminCount = parseInt(existingAdmins.rows[0].count, 10);

    if (adminCount > 0) {
      console.log(`⚠️  ${adminCount} admin(s) already exist in the database.`);
      const proceed = await prompt('Do you want to create another admin? (yes/no): ');
      if (proceed.toLowerCase() !== 'yes' && proceed.toLowerCase() !== 'y') {
        console.log('Aborted.');
        process.exit(0);
      }
    }

    // Get admin details
    let email = process.env.ADMIN_EMAIL || '';
    let password = process.env.ADMIN_PASSWORD || '';
    let firstName = process.env.ADMIN_FIRST_NAME || '';
    let lastName = process.env.ADMIN_LAST_NAME || '';

    if (!email) {
      email = await prompt('Enter your email: ');
    }

    if (!email.includes('@')) {
      console.error('❌ Invalid email address');
      process.exit(1);
    }

    if (!password) {
      password = await prompt('Enter your password (min 8 chars): ');
    }

    if (password.length < 8) {
      console.error('❌ Password must be at least 8 characters');
      process.exit(1);
    }

    if (!firstName) {
      firstName = await prompt('Enter your first name: ');
    }

    if (!lastName) {
      lastName = await prompt('Enter your last name: ');
    }

    console.log();
    console.log('Creating admin user...');

    const userId = await createAdminUser({ email, password, firstName, lastName });

    console.log();
    console.log('✅ Admin user created successfully!');
    console.log();
    console.log('────────────────────────────────────────────────────────────');
    console.log('User ID:', userId);
    console.log('Email:', email);
    console.log('Role: admin');
    console.log('Invites: Unlimited');
    console.log('────────────────────────────────────────────────────────────');
    console.log();
    console.log('You can now log in at: http://localhost:8080/login');
    console.log();

    // Create initial invite for the admin to share
    const crypto = require('crypto');
    const token = crypto.randomBytes(32).toString('base64url');
    
    await pool.query(
      `INSERT INTO invites (token, created_by, status, expires_at, created_at)
       VALUES ($1, $2, 'pending', NOW() + INTERVAL '30 days', NOW())`,
      [token, userId]
    );

    console.log('🎁 Bonus: Created your first invite token:');
    console.log(`   http://localhost:8080/register?invite_token=${token}`);
    console.log();

  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

main();
