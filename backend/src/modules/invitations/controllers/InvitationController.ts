/**
 * Invitation Controller
 * Handles HTTP requests for invitation management
 */

import { Request, Response, NextFunction } from 'express';
import * as InvitationService from '../services/InvitationService';
import { InvitationError } from '../services/InvitationService';

/**
 * Get user's invitations
 */
export const getInvitations = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { status } = req.query;

    const invitations = await InvitationService.getInvitationsByInviter(
      userId,
      status as string | undefined
    );

    res.json({
      success: true,
      invitations,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new invitation
 */
export const createInvitation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { inviteeEmail } = req.body;

    const invitation = await InvitationService.createInvitation({
      inviterId: userId,
      inviteeEmail,
    });

    res.status(201).json({
      success: true,
      invitation,
      message: 'Invitation created successfully',
    });
  } catch (error) {
    if (error instanceof InvitationError) {
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
  }
};

/**
 * Revoke an invitation
 */
export const revokeInvitation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    await InvitationService.revokeInvitation(id, userId);

    res.json({
      success: true,
      message: 'Invitation revoked successfully',
    });
  } catch (error) {
    if (error instanceof InvitationError) {
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
  }
};

/**
 * Get remaining invitation count
 */
export const getRemainingCount = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;

    const pendingCount = await InvitationService.getPendingInvitationCount(userId);
    const remaining = Math.max(0, 10 - pendingCount);

    res.json({
      success: true,
      remaining,
      pending: pendingCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Validate an invitation code (public endpoint)
 */
export const validateInvitation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { code } = req.params;

    const result = await InvitationService.validateInvitation(code);

    res.json({
      success: result.valid,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};
