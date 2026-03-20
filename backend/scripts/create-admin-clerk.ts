#!/usr/bin/env ts-node
/**
 * Admin Bootstrap Script - CLERK VERSION
 * 
 * Creates the first admin user using Clerk authentication.
 * Run this script to initialize the system with an admin account.
 * 
 * MIGRATED: Now uses Clerk instead of legacy password hashing
 * DATE: 2026-03-20
 * 
 * Usage:
 *   npm run create-admin
 * 
 * Or with environment variables:
 *   ADMIN_EMAIL=your@email.com ADMIN_PASSWORD=yourpassword npm run create-admin
 */

import * as readline from 'readline';
import { clerkClient } from '@clerk/clerk-sdk-node';
import pool from '../src/modules/database/pool';
import { logger } from '../src/modules/shared/utils/logger';

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

/**
 * Create admin user via Clerk
 * 
 * SAFETY: Always creates Clerk user first, then syncs to database
 * ROLLBACK: If DB insert fails, Clerk user should be manually deleted
 */
const createAdminUser = async (input: CreateAdminInput): Promise<{ userId: string; clerkId: string }> => {
  const { email, password, firstName, lastName } = input;

  logger.info('Creating admin user in Clerk', { email });

  // Step 1: Create user in Clerk
  const clerkUser = await clerkClient.users.createUser({
    emailAddress: [email.toLowerCase()],
    password,
    firstName,
    lastName,
    publicMetadata: {
      role: 'admin',
      verificationTier: 'advanced',
      trustScore: 1000,
      invitesRemaining: 999999,
      source: 'bootstrap_script',
      createdAt: new Date().toISOString(),
    },
    privateMetadata: {
      isBootstrapAdmin: true,
    },
  });

  logger.info('Clerk user created', { clerkId: clerkUser.id, email });

  try {
    // Step 2: Create/Update user in our database
    const result = await pool.query(
      `INSERT INTO users (
        email,
        clerk_id,
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
        clerk_id = $2,
        role = 'admin',
        verification_tier = 'advanced',
        trust_score = 1000,
        invites_remaining = 999999,
        is_active = true,
        updated_at = NOW()
      RETURNING id, email`,
      [
        email.toLowerCase(),
        clerkUser.id,      // clerk_id from Clerk
        firstName,
        lastName,
        'admin',           // role
        'advanced',        // verification_tier
        1000,              // trust_score
        999999,            // invites_remaining (unlimited)
        true,              // is_active
      ]
    );

    logger.info('Database record created/updated', { 
      userId: result.rows[0].id, 
      clerkId: clerkUser.id 
    });

    return {
      userId: result.rows[0].id,
      clerkId: clerkUser.id,
    };

  } catch (dbError) {
    // Database failed - Clerk user exists but DB doesn't
    // This requires manual cleanup
    logger.error('Database insert failed after Clerk user created', {
      clerkId: clerkUser.id,
      email,
      error: (dbError as Error).message,
    });
    
    console.error('\n❌ CRITICAL ERROR:');
    console.error('Clerk user was created but database insert failed.');
    console.error(`Clerk User ID: ${clerkUser.id}`);
    console.error('You must manually delete the Clerk user or retry this script.');
    console.error(`Delete command: clerkClient.users.deleteUser('${clerkUser.id}')`);
    
    throw dbError;
  }
};

/**
 * Create initial invite for the admin
 */
const createInitialInvite = async (createdBy: string): Promise<string> => {
  const crypto = await import('crypto');
  const token = crypto.randomBytes(32).toString('base64url');
  
  await pool.query(
    `INSERT INTO invites (token, created_by, status, expires_at, created_at)
     VALUES ($1, $2, 'pending', NOW() + INTERVAL '30 days', NOW())`,
    [token, createdBy]
  );
  
  logger.info('Initial invite created', { token: token.substring(0, 10) + '...' });
  
  return token;
};

// ============================================================================
// MAIN
// ============================================================================

const main = async (): Promise<void> => {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║       MuslimEEN Admin Bootstrap - Clerk Version            ║');
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
    console.log('Creating admin user via Clerk...');

    const { userId, clerkId } = await createAdminUser({ email, password, firstName, lastName });

    console.log();
    console.log('✅ Admin user created successfully!');
    console.log();
    console.log('────────────────────────────────────────────────────────────');
    console.log('User ID:', userId);
    console.log('Clerk ID:', clerkId);
    console.log('Email:', email);
    console.log('Role: admin');
    console.log('Invites: Unlimited');
    console.log('────────────────────────────────────────────────────────────');
    console.log();
    console.log('You can now log in at: http://localhost:3000/login');
    console.log();

    // Create initial invite for the admin to share
    const inviteToken = await createInitialInvite(userId);
    
    console.log('🎁 Bonus: Created your first invite token:');
    console.log(`   http://localhost:3000/register?invite_token=${inviteToken}`);
    console.log();

  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

main();
