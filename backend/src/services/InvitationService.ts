/**
 * Invitation Service
 * Orchestrates invitation creation, validation, and acceptance
 * Coordinates with Trust Score for reputation tracking
 */

import Invitation from '../models/Invitation';
import * as TrustScoreService from './TrustScoreService';

// ============================================================================
// INVITATION MANAGEMENT
// ============================================================================

export interface CreateInvitationData {
  inviterId: string;
  inviteeEmail: string;
}

/**
 * Create a new invitation
 * @param data Invitation data
 * @returns Created invitation
 */
export const createInvitation = async (data: CreateInvitationData) => {
  const { inviterId, inviteeEmail } = data;

  // Normalize email
  const normalizedEmail = inviteeEmail.toLowerCase().trim();

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    throw new InvitationError('INVALID_EMAIL', 'Invalid email format', 400);
  }

  // Check if inviter has remaining invitations (optional business rule)
  const pendingCount = await Invitation.countPendingByInviter(inviterId);
  if (pendingCount >= 10) {
    throw new InvitationError('INVITATION_LIMIT', 'Maximum pending invitations reached', 400);
  }

  const invitation = await Invitation.create(inviterId, normalizedEmail);
  return invitation;
};

/**
 * Get invitations created by a user
 * @param inviterId Inviter user ID
 * @param status Optional status filter
 * @returns List of invitations
 */
export const getInvitationsByInviter = async (
  inviterId: string,
  status?: string | null
) => {
  const invitations = await Invitation.getByInviter(inviterId, status);
  return invitations;
};

/**
 * Get count of pending invitations for a user
 * @param inviterId Inviter user ID
 * @returns Pending count
 */
export const getPendingInvitationCount = async (inviterId: string): Promise<number> => {
  return Invitation.countPendingByInviter(inviterId);
};

// ============================================================================
// INVITATION VALIDATION & ACCEPTANCE
// ============================================================================

/**
 * Validate an invitation code
 * @param code Invitation code
 * @returns Validation result
 */
export const validateInvitation = async (code: string) => {
  const result = await Invitation.validate(code);
  return result;
};

/**
 * Accept an invitation
 * This triggers trust score update for the inviter
 * @param code Invitation code
 * @param inviteeId User accepting the invitation
 * @returns Accepted invitation
 */
export const acceptInvitation = async (code: string, inviteeId: string) => {
  // Validate invitation first
  const validation = await Invitation.validate(code);
  if (!validation.valid) {
    throw new InvitationError('INVALID_INVITATION', validation.message || 'Invalid invitation', 400);
  }

  // Accept invitation
  const invitation = await Invitation.accept(code, inviteeId);
  
  if (!invitation) {
    throw new InvitationError('ACCEPT_FAILED', 'Failed to accept invitation', 500);
  }

  // Note: Trust score recalculation is triggered by Invitation model
  // This maintains consistency but could be moved to event-driven in future

  return invitation;
};

// ============================================================================
// INVITATION CONTROL
// ============================================================================

/**
 * Revoke a pending invitation
 * @param invitationId Invitation ID
 * @param inviterId Inviter user ID (for authorization)
 * @returns Revoked invitation
 */
export const revokeInvitation = async (invitationId: string, inviterId: string) => {
  const invitation = await Invitation.revoke(invitationId, inviterId);
  
  if (!invitation) {
    throw new InvitationError('REVOKE_FAILED', 'Invitation not found or already processed', 404);
  }

  return invitation;
};

/**
 * Clean up expired invitations
 * This should be called by a scheduled job
 * @returns Number of expired invitations
 */
export const cleanupExpiredInvitations = async (): Promise<number> => {
  const count = await Invitation.cleanupExpired();
  return count;
};

// ============================================================================
// TRUST SCORE IMPACT
// ============================================================================

/**
 * Record invitation outcome and update inviter trust score
 * Called internally when invitation is accepted, expires, or user banned
 * @param invitationId Invitation ID
 * @param inviterId Inviter user ID
 * @param outcome Outcome type
 * @param trustImpact Impact on trust score
 */
export const recordInvitationOutcome = async (
  invitationId: string,
  inviterId: string,
  outcome: 'success' | 'expired' | 'banned',
  trustImpact: number
): Promise<void> => {
  // Record the outcome
  await Invitation.recordOutcome(invitationId, inviterId, outcome, trustImpact);

  // Recalculate inviter's trust score
  await TrustScoreService.recalculate(inviterId);
};

// ============================================================================
// CUSTOM ERROR
// ============================================================================

export class InvitationError extends Error {
  public code: string;
  public statusCode: number;

  constructor(code: string, message: string, statusCode: number = 400) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.name = 'InvitationError';
  }
}
