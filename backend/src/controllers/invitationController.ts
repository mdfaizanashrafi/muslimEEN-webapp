/**
 * Invitation Controller
 * Thin HTTP handler - delegates all logic to InvitationService
 * Responsibilities: HTTP request/response only
 */

import { Request, Response, NextFunction } from 'express';
import * as InvitationService from '../services/InvitationService';

// ============================================================================
// GET INVITATIONS
// ============================================================================

export const getInvitations = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const invitations = await InvitationService.getInvitationsByInviter(userId);

    res.json({
      success: true,
      invitations,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// CREATE INVITATION
// ============================================================================

export const createInvitation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const inviterId = req.user!.id;
    const { email } = req.body;

    const invitation = await InvitationService.createInvitation({
      inviterId,
      inviteeEmail: email,
    });

    res.status(201).json({
      success: true,
      invitation,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// REVOKE INVITATION
// ============================================================================

export const revokeInvitation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const invitationId = req.params.id;

    await InvitationService.revokeInvitation(invitationId, userId);

    res.json({
      success: true,
      message: 'Invitation revoked',
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// GET REMAINING COUNT
// ============================================================================

export const getRemainingCount = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const count = await InvitationService.getPendingInvitationCount(userId);

    res.json({
      success: true,
      remaining: count,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// VALIDATE INVITATION
// ============================================================================

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
