/**
 * User Migration Script: Database → Clerk
 * 
 * MIGRATES: Existing users to Clerk authentication
 * STRATEGY: Create Clerk users with metadata, send magic links
 * SAFETY: Non-destructive, can be run multiple times
 * 
 * USAGE:
 *   npm run migrate:users-to-clerk
 * 
 * ENV:
 *   CLERK_SECRET_KEY - Required
 *   DATABASE_URL - Required
 *   MIGRATION_BATCH_SIZE - Optional (default: 100)
 *   MIGRATION_DRY_RUN - Optional (default: true)
 * 
 * DATE: 2026-03-20
 */

import { clerkClient } from '@clerk/clerk-sdk-node';
import pool from '../src/database/pool';
import { logger } from '../src/modules/shared/utils/logger';

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  BATCH_SIZE: parseInt(process.env.MIGRATION_BATCH_SIZE || '100', 10),
  DRY_RUN: process.env.MIGRATION_DRY_RUN !== 'false',
  DELAY_MS: parseInt(process.env.MIGRATION_DELAY_MS || '100', 10), // Rate limiting
};

// ============================================================================
// TYPES
// ============================================================================

interface UserToMigrate {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  verification_tier: string;
  trust_score: number;
  invites_remaining: number;
  is_active: boolean;
  clerk_id?: string;
}

interface MigrationResult {
  userId: string;
  email: string;
  status: 'success' | 'skipped' | 'error';
  clerkId?: string;
  error?: string;
}

// ============================================================================
// MIGRATION FUNCTIONS
// ============================================================================

/**
 * Fetch users without clerk_id that need migration
 */
async function fetchUsersToMigrate(offset: number = 0): Promise<UserToMigrate[]> {
  const result = await pool.query(
    `SELECT id, email, first_name, last_name, role, verification_tier, 
            trust_score, invites_remaining, is_active, clerk_id
     FROM users 
     WHERE clerk_id IS NULL 
        OR clerk_id = ''
     ORDER BY created_at ASC
     LIMIT $1 OFFSET $2`,
    [CONFIG.BATCH_SIZE, offset]
  );
  return result.rows;
}

/**
 * Count total users to migrate
 */
async function countUsersToMigrate(): Promise<number> {
  const result = await pool.query(
    `SELECT COUNT(*) as count 
     FROM users 
     WHERE clerk_id IS NULL OR clerk_id = ''`
  );
  return parseInt(result.rows[0].count, 10);
}

/**
 * Create Clerk user with metadata
 */
async function createClerkUser(user: UserToMigrate): Promise<{ clerkId: string; passwordResetUrl?: string }> {
  if (CONFIG.DRY_RUN) {
    logger.info(`[DRY RUN] Would create Clerk user for ${user.email}`);
    return { clerkId: `dry_run_${user.id}` };
  }

  try {
    // Create user in Clerk
    const clerkUser = await clerkClient.users.createUser({
      emailAddress: [user.email],
      firstName: user.first_name || undefined,
      lastName: user.last_name || undefined,
      publicMetadata: {
        role: user.role,
        verificationTier: user.verification_tier,
        trustScore: user.trust_score,
        invitesRemaining: user.invites_remaining,
        migratedAt: new Date().toISOString(),
        migrationVersion: '1.0',
      },
      privateMetadata: {
        internalUserId: user.id,
        migratedFrom: 'legacy_auth',
      },
      // Skip password - we'll use magic link
      // User will set password on first login
    });

    logger.info(`Created Clerk user`, { 
      userId: user.id, 
      clerkId: clerkUser.id,
      email: user.email 
    });

    return { clerkId: clerkUser.id };
  } catch (error: any) {
    // Handle case where user already exists in Clerk
    if (error.errors?.[0]?.code === 'form_identifier_exists') {
      logger.warn(`User already exists in Clerk`, { email: user.email });
      
      // Try to find the existing Clerk user
      const existingUsers = await clerkClient.users.getUserList({
        emailAddress: [user.email],
      });
      
      if (existingUsers.data.length > 0) {
        const existingClerkId = existingUsers.data[0].id;
        
        // Update metadata to ensure consistency
        await clerkClient.users.updateUser(existingClerkId, {
          publicMetadata: {
            role: user.role,
            verificationTier: user.verification_tier,
            trustScore: user.trust_score,
            invitesRemaining: user.invites_remaining,
            migratedAt: new Date().toISOString(),
            migrationVersion: '1.0',
          },
          privateMetadata: {
            internalUserId: user.id,
            migratedFrom: 'legacy_auth',
          },
        });
        
        return { clerkId: existingClerkId };
      }
    }
    
    throw error;
  }
}

/**
 * Update database with clerk_id
 */
async function updateUserClerkId(userId: string, clerkId: string): Promise<void> {
  if (CONFIG.DRY_RUN) {
    logger.info(`[DRY RUN] Would update clerk_id for user ${userId}`);
    return;
  }

  await pool.query(
    'UPDATE users SET clerk_id = $1, updated_at = NOW() WHERE id = $2',
    [clerkId, userId]
  );

  logger.debug(`Updated clerk_id in database`, { userId, clerkId });
}

/**
 * Send magic link to user for password setup
 */
async function sendMagicLink(email: string): Promise<void> {
  if (CONFIG.DRY_RUN) {
    logger.info(`[DRY RUN] Would send magic link to ${email}`);
    return;
  }

  try {
    // Create a password reset/sign-in link
    // Note: This uses Clerk's sign-in token feature
    const signInToken = await clerkClient.signInTokens.createSignInToken({
      userId: email, // Clerk will resolve this to user ID
      expiresInSeconds: 7 * 24 * 60 * 60, // 7 days
    });

    // The user can use this token to sign in and set their password
    // In production, you'd send this via email using your email provider
    logger.info(`Created sign-in token for magic link`, { email });
    
    // TODO: Integrate with your email service to send the magic link
    // Example: await sendEmail(email, 'magic-link', { token: signInToken.token });
    
  } catch (error: any) {
    logger.error(`Failed to create magic link`, { email, error: error.message });
    // Don't throw - we can retry this later
  }
}

/**
 * Migrate a single user
 */
async function migrateUser(user: UserToMigrate): Promise<MigrationResult> {
  try {
    logger.info(`Migrating user`, { userId: user.id, email: user.email });

    // Skip inactive users (optional - adjust as needed)
    if (!user.is_active) {
      logger.warn(`Skipping inactive user`, { userId: user.id, email: user.email });
      return { userId: user.id, email: user.email, status: 'skipped', error: 'User inactive' };
    }

    // Create Clerk user
    const { clerkId } = await createClerkUser(user);

    // Update database
    await updateUserClerkId(user.id, clerkId);

    // Send magic link for password setup
    await sendMagicLink(user.email);

    return { userId: user.id, email: user.email, status: 'success', clerkId };

  } catch (error: any) {
    logger.error(`Migration failed for user`, { 
      userId: user.id, 
      email: user.email, 
      error: error.message 
    });
    return { 
      userId: user.id, 
      email: user.email, 
      status: 'error', 
      error: error.message 
    };
  }
}

/**
 * Run migration
 */
async function runMigration(): Promise<void> {
  logger.info('========================================');
  logger.info('Starting User Migration to Clerk');
  logger.info(`Mode: ${CONFIG.DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  logger.info(`Batch Size: ${CONFIG.BATCH_SIZE}`);
  logger.info('========================================');

  // Verify Clerk is configured
  if (!process.env.CLERK_SECRET_KEY) {
    throw new Error('CLERK_SECRET_KEY is required');
  }

  // Count users to migrate
  const totalUsers = await countUsersToMigrate();
  logger.info(`Found ${totalUsers} users to migrate`);

  if (totalUsers === 0) {
    logger.info('No users to migrate. Exiting.');
    return;
  }

  if (CONFIG.DRY_RUN) {
    logger.info('DRY RUN: No actual changes will be made');
  }

  // Confirm before live run
  if (!CONFIG.DRY_RUN && process.stdout.isTTY) {
    // In a real script, you'd prompt for confirmation here
    logger.info('LIVE MODE: Starting migration in 5 seconds...');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  // Migrate users in batches
  let offset = 0;
  let processed = 0;
  let succeeded = 0;
  let skipped = 0;
  let failed = 0;
  const errors: MigrationResult[] = [];

  while (processed < totalUsers) {
    const users = await fetchUsersToMigrate(offset);
    
    if (users.length === 0) break;

    logger.info(`Processing batch of ${users.length} users (offset: ${offset})`);

    for (const user of users) {
      const result = await migrateUser(user);
      processed++;

      switch (result.status) {
        case 'success':
          succeeded++;
          break;
        case 'skipped':
          skipped++;
          break;
        case 'error':
          failed++;
          errors.push(result);
          break;
      }

      // Rate limiting delay
      if (CONFIG.DELAY_MS > 0) {
        await new Promise(resolve => setTimeout(resolve, CONFIG.DELAY_MS));
      }
    }

    offset += users.length;

    // Progress report
    logger.info(`Progress: ${processed}/${totalUsers} (${succeeded} success, ${skipped} skipped, ${failed} failed)`);
  }

  // Final report
  logger.info('========================================');
  logger.info('Migration Complete');
  logger.info(`Total Processed: ${processed}`);
  logger.info(`Successful: ${succeeded}`);
  logger.info(`Skipped: ${skipped}`);
  logger.info(`Failed: ${failed}`);
  logger.info('========================================');

  if (errors.length > 0) {
    logger.info('Errors encountered:');
    errors.forEach(e => {
      logger.info(`  - ${e.email}: ${e.error}`);
    });
  }

  // Exit with error code if any failures
  if (failed > 0) {
    process.exit(1);
  }
}

// ============================================================================
// MAIN
// ============================================================================

if (require.main === module) {
  runMigration()
    .then(() => {
      logger.info('Migration script completed successfully');
      process.exit(0);
    })
    .catch(error => {
      logger.error('Migration script failed', { error: error.message });
      process.exit(1);
    });
}

export { runMigration };
