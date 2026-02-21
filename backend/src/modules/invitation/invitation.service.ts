/**
 * Invitation Service
 * Handles invitation creation, management, and tracking
 */

import { InvitationCreateInput, ValidationResult } from './invitation.types';

// Max invitations per month per user
const MAX_INVITATIONS_PER_MONTH = 5;

// Models will be imported from the models directory
const Invitation = require('../../models/Invitation');
const User = require('../../models/User');
const logger = require('../../utils/logger');

export class InvitationService {
  /**
   * Get user's invitations
   */
  static async getInvitations(userId: string, status?: string) {
    return await Invitation.getByInviter(userId, status);
  }

  /**
   * Create new invitation
   */
  static async createInvitation(userId: string, inviteeEmail: string) {
    // Check if user has remaining invitations this month
    const pendingCount = await Invitation.countPendingByInviter(userId);

    if (pendingCount >= MAX_INVITATIONS_PER_MONTH) {
      throw new InvitationLimitError(
        `You can only have ${MAX_INVITATIONS_PER_MONTH} pending invitations at a time`
      );
    }

    // Check if email already has a pending invitation
    const db = require('../../config/database');
    const existingQuery = `
      SELECT * FROM invitations
      WHERE invitee_email = $1 AND status = 'pending'
    `;
    const existingResult = await db.query(existingQuery, [inviteeEmail.toLowerCase()]);

    if (existingResult.rows.length > 0) {
      throw new InvitationExistsError('This email already has a pending invitation');
    }

    // Check if email is already registered
    const existingUser = await User.findByEmail(inviteeEmail);
    if (existingUser) {
      throw new EmailRegisteredError('This email is already registered');
    }

    const invitation = await Invitation.create(userId, inviteeEmail);

    logger.info(`Invitation created: ${invitation.code} by ${userId} for ${inviteeEmail}`);

    return invitation;
  }

  /**
   * Revoke invitation
   */
  static async revokeInvitation(id: string, userId: string) {
    const invitation = await Invitation.revoke(id, userId);

    if (!invitation) {
      return null;
    }

    logger.info(`Invitation revoked: ${id} by ${userId}`);

    return invitation;
  }

  /**
   * Validate invitation by code
   */
  static async validateInvitation(code: string): Promise<ValidationResult> {
    return await Invitation.validate(code);
  }

  /**
   * Get remaining invitations count
   */
  static async getRemainingCount(userId: string) {
    const pendingCount = await Invitation.countPendingByInviter(userId);
    const remaining = Math.max(0, MAX_INVITATIONS_PER_MONTH - pendingCount);

    return {
      remaining,
      max: MAX_INVITATIONS_PER_MONTH
    };
  }
}

export class InvitationLimitError extends Error {
  code = 'INVITATION_LIMIT_REACHED';
  constructor(message: string) {
    super(message);
    this.name = 'InvitationLimitError';
  }
}

export class InvitationExistsError extends Error {
  code = 'INVITATION_EXISTS';
  constructor(message: string) {
    super(message);
    this.name = 'InvitationExistsError';
  }
}

export class EmailRegisteredError extends Error {
  code = 'EMAIL_REGISTERED';
  constructor(message: string) {
    super(message);
    this.name = 'EmailRegisteredError';
  }
}
