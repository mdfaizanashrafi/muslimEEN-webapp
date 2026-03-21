/**
 * Invite Controller - HARDENED VERSION
 * 
 * SECURITY IMPROVEMENTS:
 * 1. Generic error messages (prevents invite enumeration)
 * 2. Rate limiting on all endpoints
 * 3. Returns signed tokens (not raw codes)
 * 4. Input sanitization
 */

import { Request, Response, NextFunction } from 'express';
import { env } from '../../../config/env';
import * as InviteService from '../services/InviteServiceHardened';
import { logger } from '../../shared/utils/logger';

// ============================================================================
// SECURITY: Generic error message for ALL invite failures
// ============================================================================

const GENERIC_INVITE_ERROR = 'Invalid or expired invite code';

// ============================================================================
// VALIDATE INVITE (PUBLIC - With Rate Limiting)
// ============================================================================

/**
 * POST /invites/validate
 * Validate an invite code and return signed token
 * 
 * SECURITY:
 * - Rate limited (5 per minute per IP)
 * - Returns signed token (not raw code)
 * - Generic error messages
 */
export const validateInvite = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { code } = req.body;
    
    // Input validation
    if (!code || typeof code !== 'string') {
      res.status(400).json({
        success: false,
        valid: false,
        error: GENERIC_INVITE_ERROR,
      });
      return;
    }
    
    // Sanitize input (alphanumeric and dashes only)
    const sanitizedCode = code.toUpperCase().trim();
    if (!/^[A-Z0-9-]+$/.test(sanitizedCode)) {
      res.status(400).json({
        success: false,
        valid: false,
        error: GENERIC_INVITE_ERROR,
      });
      return;
    }
    
    // Get client IP for rate limiting (already applied by middleware)
    const clientIp = req.ip || req.socket.remoteAddress;
    
    // Validate invite
    const result = await InviteService.validateInvite(sanitizedCode, clientIp);
    
    if (!result.valid) {
      // SECURITY: Return generic error regardless of actual reason
      res.status(400).json({
        success: false,
        valid: false,
        error: GENERIC_INVITE_ERROR,
      });
      return;
    }
    
    // Success - return signed token
    res.json({
      success: true,
      valid: true,
      signedToken: result.signedToken,
    });
    
  } catch (error) {
    logger.error('Invite validation endpoint error', {
      error: (error as Error).message,
      tags: { module: 'invites', type: 'error' },
    });
    
    // SECURITY: Generic error even for server errors
    res.status(500).json({
      success: false,
      valid: false,
      error: 'Unable to validate invite. Please try again.',
    });
  }
};

// ============================================================================
// CREATE INVITE (AUTHENTICATED)
// ============================================================================

/**
 * POST /invites
 * Create a new invite
 * 
 * SECURITY:
 * - Rate limited per user
 * - Max active invites enforced
 * - Returns signed token
 */
export const createInvite = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }
    
    const result = await InviteService.createInvite(userId, userRole);
    
    if (!result.success) {
      res.status(400).json({
        success: false,
        error: result.error,
      });
      return;
    }
    
    // Get updated quota
    const quota = await InviteService.getUserInviteQuota(userId);
    
    res.status(201).json({
      success: true,
      invite: {
        id: result.invite!.id,
        code: result.invite!.code, // Only time raw code is returned
        signedToken: result.invite!.signedToken,
        expiresAt: result.invite!.expiresAt,
      },
      remainingInvites: quota.remaining,
    });
    
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// GET USER INVITES
// ============================================================================

export const getUserInvites = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }
    
    const invites = await InviteService.getUserInvites(userId);
    
    // Note: Raw codes are NOT returned (only hashes stored)
    res.json({
      success: true,
      invites: invites.map(invite => ({
        id: invite.id,
        status: invite.status,
        expiresAt: invite.expiresAt,
        createdAt: invite.createdAt,
        usedAt: invite.usedAt,
        usedBy: invite.usedBy,
      })),
    });
    
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// GET USER INVITE QUOTA
// ============================================================================

export const getUserInviteQuota = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }
    
    const quota = await InviteService.getUserInviteQuota(userId);
    
    res.json({
      success: true,
      quota: {
        remaining: quota.remaining,
        used: quota.used,
        total: quota.total,
        isUnlimited: quota.isUnlimited,
      },
    });
    
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// REVOKE INVITE
// ============================================================================

export const revokeInvite = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;
    const { id } = req.params;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }
    
    const isAdmin = ['admin', 'super_admin'].includes(userRole);
    const success = await InviteService.revokeInvite(id, userId, isAdmin);
    
    if (!success) {
      res.status(400).json({
        success: false,
        error: 'Failed to revoke invite',
      });
      return;
    }
    
    res.json({
      success: true,
      message: 'Invite revoked successfully',
    });
    
  } catch (error) {
    next(error);
  }
};
