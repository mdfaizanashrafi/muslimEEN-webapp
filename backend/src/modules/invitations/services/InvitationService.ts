/**
 * Invitation Service
 * Orchestrates invitation creation, validation, and acceptance
 */

import * as InvitationRepository from '../repositories/InvitationRepository';
import { eventBus, DomainEvents } from '../../shared/events/EventBus';

// ============================================================================
// TYPES
// ============================================================================

export interface CreateInvitationData {
  inviterId: string;
  inviteeEmail: string;
}

export interface Invitation {
  id: string;
  code: string;
  inviteeEmail: string;
  createdBy: string;
  status: 'pending' | 'used' | 'expired' | 'revoked';
  maxUses: number;
  usedCount: number;
  createdAt: Date;
  expiresAt?: Date;
}

// ============================================================================
// INVITATION MANAGEMENT
// ============================================================================

/**
 * Create a new invitation
 */
export const createInvitation = async (data: CreateInvitationData): Promise<Invitation> => {
  const { inviterId, inviteeEmail } = data;

  // Normalize email
  const normalizedEmail = inviteeEmail.toLowerCase().trim();

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    throw new InvitationError('INVALID_EMAIL', 'Invalid email format', 400);
  }

  // Check if inviter has remaining invitations
  const pendingCount = await InvitationRepository.countPendingByInviter(inviterId);
  if (pendingCount >= 10) {
    throw new InvitationError('INVITATION_LIMIT', 'Maximum pending invitations reached', 400);
  }

  const invitation = await InvitationRepository.create(inviterId, normalizedEmail);
  
  // Publish event
  await eventBus.publish(DomainEvents.INVITATION_CREATED, {
    invitationId: invitation.id,
    inviterId,
    inviteeEmail: normalizedEmail,
  });

  return invitation;
};

/**
 * Get invitations created by a user
 */
export const getInvitationsByInviter = async (
  inviterId: string,
  status?: string | null
): Promise<Invitation[]> => {
  return InvitationRepository.getByInviter(inviterId, status);
};

/**
 * Get count of pending invitations for a user
 */
export const getPendingInvitationCount = async (inviterId: string): Promise<number> => {
  return InvitationRepository.countPendingByInviter(inviterId);
};

// ============================================================================
// INVITATION VALIDATION & ACCEPTANCE
// ============================================================================

/**
 * Validate an invitation code
 */
export const validateInvitation = async (code: string) => {
  const result = await InvitationRepository.validateByCode(code);
  return result;
};

/**
 * Accept an invitation
 */
export const acceptInvitation = async (code: string, inviteeId: string): Promise<Invitation> => {
  // Validate invitation first
  const validation = await InvitationRepository.validateByCode(code);
  if (!validation.valid) {
    throw new InvitationError('INVALID_INVITATION', validation.message || 'Invalid invitation', 400);
  }

  // Accept invitation
  const invitation = await InvitationRepository.markAsUsed(code, inviteeId);
  
  if (!invitation) {
    throw new InvitationError('ACCEPT_FAILED', 'Failed to accept invitation', 500);
  }

  // Publish event
  await eventBus.publish(DomainEvents.INVITATION_ACCEPTED, {
    invitationId: invitation.id,
    inviteeId,
    inviterId: invitation.createdBy,
  });

  return invitation;
};

// ============================================================================
// INVITATION CONTROL
// ============================================================================

/**
 * Revoke a pending invitation
 */
export const revokeInvitation = async (invitationId: string, inviterId: string): Promise<Invitation> => {
  const invitation = await InvitationRepository.revoke(invitationId, inviterId);
  
  if (!invitation) {
    throw new InvitationError('REVOKE_FAILED', 'Invitation not found or already processed', 404);
  }

  // Publish event
  await eventBus.publish(DomainEvents.INVITATION_REVOKED, {
    invitationId,
    inviterId,
  });

  return invitation;
};

/**
 * Clean up expired invitations
 */
export const cleanupExpiredInvitations = async (): Promise<number> => {
  return InvitationRepository.cleanupExpired();
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
