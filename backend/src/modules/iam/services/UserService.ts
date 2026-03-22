/**
 * User Service - ELITE PRODUCTION GRADE
 * 
 * Handles user creation and blocking (safe failure handling)
 * 
 * DATE: 2026-03-21
 */

import { createClerkClient } from '@clerk/backend';
import { env } from '../../../config/env';
import { logger } from '../../shared/utils/logger';
import { recordMetric, Metrics } from '../../shared/utils/metrics';
import pool from '../../database/pool';
import * as UserRepository from '../repositories/UserRepository';
import { UserRole, VerificationTier } from '../../shared/types';

const clerk = createClerkClient({ secretKey: env.CLERK_SECRET_KEY });

// ============================================================================
// TYPES
// ============================================================================

export interface CreateUserInput {
  clerkUserId: string;
  email: string;
  firstName: string;
  lastName: string;
  invitedBy?: string;
}

export interface CreateUserResult {
  success: boolean;
  userId?: string;
  error?: string;
}

export interface BlockUserInput {
  clerkUserId: string;
  reason: string;
  metadata?: Record<string, any>;
}

export interface BlockUserResult {
  success: boolean;
  error?: string;
}

// ============================================================================
// CREATE USER (with idempotency)
// ============================================================================

/**
 * Create internal user record after successful invite consumption
 * 
 * Idempotent: Returns existing user if already created
 */
export const createInternalUser = async (
  input: CreateUserInput
): Promise<CreateUserResult> => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Check for existing user (idempotency)
    const existingUser = await UserRepository.findByClerkId(input.clerkUserId);
    if (existingUser) {
      logger.info('USER_ALREADY_EXISTS', {
        clerkUserId: input.clerkUserId,
        userId: existingUser.id,
      });
      await client.query('COMMIT');
      return { success: true, userId: existingUser.id };
    }
    
    // Create new user
    const newUser = await UserRepository.createWithClient(client, {
      clerk_id: input.clerkUserId,
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      role: 'muslim_unverified' as UserRole,
      verificationTier: 'basic' as VerificationTier,
      invitedBy: input.invitedBy,
      invitesRemaining: 3, // New users get 3 invites
    });
    
    await client.query('COMMIT');
    
    logger.info('USER_CREATED', {
      userId: newUser.id,
      clerkUserId: input.clerkUserId,
      email: input.email,
      invitedBy: input.invitedBy,
    });
    
    return { success: true, userId: newUser.id };
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('USER_CREATE_FAILED', {
      error: (error as Error).message,
      clerkUserId: input.clerkUserId,
    });
    return { success: false, error: 'Failed to create user record' };
  } finally {
    client.release();
  }
};

// ============================================================================
// BLOCK USER (safe failure handling)
// ============================================================================

/**
 * Block a Clerk user instead of deleting
 * 
 * Safe: Preserves audit trail, reversible if needed
 */
export const blockClerkUser = async (
  input: BlockUserInput
): Promise<BlockUserResult> => {
  try {
    // Update Clerk metadata to mark as blocked
    await clerk.users.updateUser(input.clerkUserId, {
      publicMetadata: {
        blocked: true,
        blockReason: input.reason,
        blockedAt: new Date().toISOString(),
        blockMetadata: input.metadata || {},
      },
    });
    
    // Also create internal blocked record if we have a DB user
    try {
      const user = await UserRepository.findByClerkId(input.clerkUserId);
      if (user) {
        await UserRepository.update(user.id, {
          isActive: false,
        });
      }
    } catch (dbError) {
      // Log but don't fail - Clerk block is the source of truth
      logger.warn('Failed to update internal block record', {
        clerkUserId: input.clerkUserId,
        error: (dbError as Error).message,
      });
    }
    
    await recordMetric(Metrics.USER_BLOCKED, 1, { reason: input.reason });
    
    logger.info('USER_BLOCKED', {
      clerkUserId: input.clerkUserId,
      reason: input.reason,
      metadata: input.metadata,
    });
    
    return { success: true };
  } catch (error) {
    logger.error('USER_BLOCK_FAILED', {
      error: (error as Error).message,
      clerkUserId: input.clerkUserId,
    });
    return { success: false, error: 'Failed to block user' };
  }
};

// ============================================================================
// CHECK IF USER IS BLOCKED
// ============================================================================

export const isUserBlocked = async (clerkUserId: string): Promise<boolean> => {
  try {
    const clerkUser = await clerk.users.getUser(clerkUserId);
    return clerkUser.publicMetadata?.blocked === true;
  } catch (error) {
    logger.error('Failed to check user block status', {
      error: (error as Error).message,
      clerkUserId,
    });
    // Fail safe - treat as blocked if we can't verify
    return true;
  }
};

// ============================================================================
// GET USER BLOCK INFO
// ============================================================================

export const getUserBlockInfo = async (
  clerkUserId: string
): Promise<{ blocked: boolean; reason?: string; blockedAt?: string }> => {
  try {
    const clerkUser = await clerk.users.getUser(clerkUserId);
    const metadata = clerkUser.publicMetadata;
    
    if (metadata?.blocked) {
      return {
        blocked: true,
        reason: metadata.blockReason as string,
        blockedAt: metadata.blockedAt as string,
      };
    }
    
    return { blocked: false };
  } catch (error) {
    logger.error('Failed to get user block info', {
      error: (error as Error).message,
      clerkUserId,
    });
    return { blocked: true, reason: 'Verification failed' };
  }
};
