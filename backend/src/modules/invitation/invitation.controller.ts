/**
 * Invitation Controller
 * Handles invitation HTTP requests
 */

import { Request, Response, NextFunction } from 'express';
import { InvitationService, InvitationLimitError, InvitationExistsError, EmailRegisteredError } from './invitation.service';

export class InvitationController {
  /**
   * Get user's invitations
   * GET /api/invitations
   */
  static async getInvitations(req: Request, res: Response, next: NextFunction) {
    try {
      const { status } = req.query;

      const invitations = await InvitationService.getInvitations(req.user.id, status as string);

      res.json({
        success: true,
        invitations
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new invitation
   * POST /api/invitations
   */
  static async createInvitation(req: Request, res: Response, next: NextFunction) {
    try {
      const { inviteeEmail } = req.body;

      const invitation = await InvitationService.createInvitation(req.user.id, inviteeEmail);

      res.status(201).json({
        success: true,
        invitation,
        message: 'Invitation created successfully'
      });
    } catch (error) {
      if (error instanceof InvitationLimitError) {
        return res.status(429).json({
          success: false,
          error: {
            code: error.code,
            message: error.message
          }
        });
      }
      if (error instanceof InvitationExistsError) {
        return res.status(409).json({
          success: false,
          error: {
            code: error.code,
            message: error.message
          }
        });
      }
      if (error instanceof EmailRegisteredError) {
        return res.status(409).json({
          success: false,
          error: {
            code: error.code,
            message: error.message
          }
        });
      }
      next(error);
    }
  }

  /**
   * Revoke invitation
   * DELETE /api/invitations/:id
   */
  static async revokeInvitation(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const invitation = await InvitationService.revokeInvitation(id, req.user.id);

      if (!invitation) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Invitation not found or already accepted'
          }
        });
      }

      res.json({
        success: true,
        message: 'Invitation revoked'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get invitation by code (public)
   * GET /api/invitations/validate/:code
   */
  static async validateInvitation(req: Request, res: Response, next: NextFunction) {
    try {
      const { code } = req.params;

      const result = await InvitationService.validateInvitation(code);

      res.json({
        success: result.valid,
        message: result.message,
        ...(result.invitation && { data: { invitation: result.invitation } })
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get remaining invitations count
   * GET /api/invitations/remaining
   */
  static async getRemainingCount(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await InvitationService.getRemainingCount(req.user.id);

      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }
}
