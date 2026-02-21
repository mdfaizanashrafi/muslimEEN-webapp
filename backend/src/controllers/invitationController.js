/**
 * Invitation Controller
 * Handles invitation creation, management, and tracking
 */

const Invitation = require('../models/Invitation');
const User = require('../models/User');
const logger = require('../utils/logger');

// Max invitations per month per user
const MAX_INVITATIONS_PER_MONTH = 5;

/**
 * Get user's invitations
 * GET /api/invitations
 */
const getInvitations = async (req, res, next) => {
  try {
    const { status } = req.query;

    const invitations = await Invitation.getByInviter(req.user.id, status);

    res.json({
      success: true,
      invitations
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new invitation
 * POST /api/invitations
 */
const createInvitation = async (req, res, next) => {
  try {
    const { inviteeEmail } = req.body;

    // Check if user has remaining invitations this month
    const pendingCount = await Invitation.countPendingByInviter(req.user.id);
    
    if (pendingCount >= MAX_INVITATIONS_PER_MONTH) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'INVITATION_LIMIT_REACHED',
          message: `You can only have ${MAX_INVITATIONS_PER_MONTH} pending invitations at a time`
        }
      });
    }

    // Check if email already has a pending invitation
    const db = require('../config/database');
    const existingQuery = `
      SELECT * FROM invitations
      WHERE invitee_email = $1 AND status = 'pending'
    `;
    const existingResult = await db.query(existingQuery, [inviteeEmail.toLowerCase()]);

    if (existingResult.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'INVITATION_EXISTS',
          message: 'This email already has a pending invitation'
        }
      });
    }

    // Check if email is already registered
    const existingUser = await User.findByEmail(inviteeEmail);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'EMAIL_REGISTERED',
          message: 'This email is already registered'
        }
      });
    }

    const invitation = await Invitation.create(req.user.id, inviteeEmail);

    logger.info(`Invitation created: ${invitation.code} by ${req.user.id} for ${inviteeEmail}`);

    res.status(201).json({
      success: true,
      invitation,
      message: 'Invitation created successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Revoke invitation
 * DELETE /api/invitations/:id
 */
const revokeInvitation = async (req, res, next) => {
  try {
    const { id } = req.params;

    const invitation = await Invitation.revoke(id, req.user.id);

    if (!invitation) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Invitation not found or already accepted'
        }
      });
    }

    logger.info(`Invitation revoked: ${id} by ${req.user.id}`);

    res.json({
      success: true,
      message: 'Invitation revoked'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get invitation by code (public)
 * GET /api/invitations/validate/:code
 */
const validateInvitation = async (req, res, next) => {
  try {
    const { code } = req.params;

    const result = await Invitation.validate(code);

    res.json({
      success: result.valid,
      message: result.message,
      ...(result.invitation && { data: { invitation: result.invitation } })
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get remaining invitations count
 * GET /api/invitations/remaining
 */
const getRemainingCount = async (req, res, next) => {
  try {
    const pendingCount = await Invitation.countPendingByInviter(req.user.id);
    const remaining = Math.max(0, MAX_INVITATIONS_PER_MONTH - pendingCount);

    res.json({
      success: true,
      remaining,
      max: MAX_INVITATIONS_PER_MONTH
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInvitations,
  createInvitation,
  revokeInvitation,
  validateInvitation,
  getRemainingCount
};
