/**
 * Invite Controller
 * 
 * HTTP request handlers for invite operations.
 * All business logic is delegated to InviteService.
 */

import { Request, Response, NextFunction } from 'express';
import { env } from '../../../config/env';
import * as InviteService from '../services/InviteService';
import { InviteError } from '../services/InviteService';
import { AuthRequest } from '../../shared/types';

// ============================================================================
// USER INVITE ENDPOINTS
// ============================================================================

/**
 * POST /invites
 * Create a new invite
 */
export const createInvite = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const { email } = req.body;

    // Get user's remaining invites
    const quota = await InviteService.getUserInviteQuota(userId);

    let invite;
    if (email) {
      // Create invite for specific email
      invite = await InviteService.createInviteForEmail({
        createdBy: userId,
        createdByRole: userRole,
        inviteeEmail: email,
        inviterInviteCount: quota.remaining,
      });
    } else {
      // Create general invite
      invite = await InviteService.createInvite({
        createdBy: userId,
        createdByRole: userRole,
        inviterInviteCount: quota.remaining,
      });
    }

    // Get updated quota
    const updatedQuota = await InviteService.getUserInviteQuota(userId);

    // Build invite link
    const baseUrl = env.FRONTEND_URL;
    const inviteLink = `${baseUrl}/register?invite_token=${invite.token}`;

    res.status(201).json({
      success: true,
      message: 'Invite created successfully',
      data: {
        invite: {
          id: invite.id,
          token: invite.token,
          inviteLink,
          expiresAt: invite.expiresAt,
        },
        remainingInvites: updatedQuota.remaining,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /invites
 * Get user's invites
 */
export const getUserInvites = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const invites = await InviteService.getUserInvites(userId);

    const baseUrl = env.FRONTEND_URL;

    res.json({
      success: true,
      data: {
        invites: invites.map(invite => ({
          id: invite.id,
          token: invite.token,
          status: invite.status,
          inviteLink: `${baseUrl}/register?invite_token=${invite.token}`,
          expiresAt: invite.expiresAt,
          createdAt: invite.createdAt,
          usedAt: invite.usedAt,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /invites/quota
 * Get user's invite quota
 */
export const getUserInviteQuota = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const quota = await InviteService.getUserInviteQuota(userId);

    res.json({
      success: true,
      data: {
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

/**
 * DELETE /invites/:id
 * Revoke an invite
 */
export const revokeInvite = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const isAdmin = req.user!.role === 'admin' || req.user!.role === 'super_admin';

    await InviteService.revokeInvite(id, userId, isAdmin);

    res.json({
      success: true,
      message: 'Invite revoked successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// PUBLIC INVITE VALIDATION
// ============================================================================

/**
 * GET /invites/validate/:token
 * Validate an invite token (public endpoint for registration)
 */
export const validateInvite = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token } = req.params;
    const result = await InviteService.validateInvite(token);

    if (!result.valid) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INVITE',
          message: result.message || 'Invalid invite token',
        },
      });
      return;
    }

    res.json({
      success: true,
      data: {
        valid: true,
        invite: {
          id: result.invite!.id,
          inviterName: result.invite!.inviterName,
          expiresAt: result.invite!.expiresAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// ADMIN ENDPOINTS
// ============================================================================

/**
 * POST /admin/invites
 * Create admin invite (unlimited, any email)
 */
export const createAdminInvite = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { email, expiresInDays } = req.body;

    const invite = await InviteService.createAdminInvite({
      createdBy: userId,
      inviteeEmail: email,
      expiresInDays,
    });

    const baseUrl = env.FRONTEND_URL;
    const inviteLink = `${baseUrl}/register?invite_token=${invite.token}`;

    res.status(201).json({
      success: true,
      message: 'Admin invite created successfully',
      data: {
        invite: {
          id: invite.id,
          token: invite.token,
          inviteLink,
          expiresAt: invite.expiresAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /admin/invites/analytics
 * Get invite analytics
 */
export const getInviteAnalytics = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const analytics = await InviteService.getInviteAnalytics();

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /admin/invites/users
 * Get user invite analytics
 */
export const getUserInviteAnalytics = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const analytics = await InviteService.getUserInviteAnalytics();

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// ERROR HANDLER
// ============================================================================

export const handleInviteError = (
  error: Error,
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (error instanceof InviteError) {
    res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    });
    return;
  }
  next(error);
};
