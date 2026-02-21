/**
 * Invitation Routes
 * MuslimEEN Backend
 */

import { Router } from 'express';
import { InvitationController } from './invitation.controller';

// Middleware will be imported from middleware directory
const { authenticate } = require('../../middleware/auth');
const { userLimiter, authLimiter } = require('../../middleware/rateLimiter');

const router = Router();

// GET /api/invitations - Get user's invitations
router.get('/', authenticate, userLimiter, InvitationController.getInvitations);

// POST /api/invitations - Create new invitation
router.post('/', authenticate, userLimiter, InvitationController.createInvitation);

// DELETE /api/invitations/:id - Revoke invitation
router.delete('/:id', authenticate, userLimiter, InvitationController.revokeInvitation);

// GET /api/invitations/remaining - Get remaining invitations count
router.get('/remaining', authenticate, userLimiter, InvitationController.getRemainingCount);

// GET /api/invitations/validate/:code - Validate invitation by code (public)
router.get('/validate/:code', authLimiter, InvitationController.validateInvitation);

export default router;
