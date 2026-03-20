/**
 * Seed User Script - CLERK VERSION
 * Creates a test user for testing via Clerk
 * 
 * MIGRATED: Now uses Clerk instead of bcrypt password hashing
 * DATE: 2026-03-20
 * 
 * Usage: DATABASE_URL="your-db-url" CLERK_SECRET_KEY="sk_..." npx ts-node seed-user-clerk.ts
 */

import { clerkClient } from '@clerk/clerk-sdk-node';
import pool from '../src/modules/database/pool';
import { logger } from '../src/modules/shared/utils/logger';

// Test user configuration
const TEST_USER = {
  email: 'test@example.com',
  password: 'TestPass123!',
  firstName: 'Test',
  lastName: 'User',
  role: 'muslim_unverified',
  verificationTier: 'basic',
};

/**
 * Create test user via Clerk
 */
async function createTestUser() {
  logger.info('Starting test user creation via Clerk', { email: TEST_USER.email });
  
  try {
    // Check if users table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ Users table does not exist. Run migrations first!');
      process.exit(1);
    }
    
    // Check if user already exists in Clerk
    const existingUsers = await clerkClient.users.getUserList({
      emailAddress: [TEST_USER.email],
    });
    
    let clerkId: string;
    
    if (existingUsers.data.length > 0) {
      console.log('⚠️  Test user already exists in Clerk. Updating...');
      clerkId = existingUsers.data[0].id;
      
      // Update password
      await clerkClient.users.updateUser(clerkId, {
        password: TEST_USER.password,
      });
      
      logger.info('Updated existing Clerk user', { clerkId });
    } else {
      console.log('🔄 Creating test user in Clerk...');
      
      // Create in Clerk
      const clerkUser = await clerkClient.users.createUser({
        emailAddress: [TEST_USER.email],
        password: TEST_USER.password,
        firstName: TEST_USER.firstName,
        lastName: TEST_USER.lastName,
        publicMetadata: {
          role: TEST_USER.role,
          verificationTier: TEST_USER.verificationTier,
          trustScore: 0,
          invitesRemaining: 0,
          isTestUser: true,
        },
      });
      
      clerkId = clerkUser.id;
      logger.info('Created Clerk user', { clerkId });
    }
    
    // Sync to database
    await pool.query(
      `INSERT INTO users (id, email, clerk_id, first_name, last_name, role, verification_tier, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (email) DO UPDATE 
       SET clerk_id = $2, 
           first_name = $3, 
           last_name = $4,
           updated_at = NOW()`,
      [
        TEST_USER.email,
        clerkId,
        TEST_USER.firstName,
        TEST_USER.lastName,
        TEST_USER.role,
        TEST_USER.verificationTier,
      ]
    );
    
    logger.info('Database record synced', { email: TEST_USER.email, clerkId });
    
    console.log('');
    console.log('✅ Test user created/updated successfully!');
    console.log('');
    console.log('🎉 LOGIN CREDENTIALS:');
    console.log('   Email:', TEST_USER.email);
    console.log('   Password:', TEST_USER.password);
    console.log('   Clerk ID:', clerkId);
    console.log('');
    console.log('⚠️  NOTE: Login via Clerk at http://localhost:3000/login');
    console.log('');
    
  } catch (error) {
    console.error('❌ Error:', (error as Error).message);
    logger.error('Test user creation failed', { error: (error as Error).message });
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Validate environment
if (!process.env.CLERK_SECRET_KEY) {
  console.error('❌ Please set CLERK_SECRET_KEY environment variable');
  console.error('   Example: CLERK_SECRET_KEY=sk_test_... npx ts-node seed-user-clerk.ts');
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error('❌ Please set DATABASE_URL environment variable');
  process.exit(1);
}

createTestUser();
