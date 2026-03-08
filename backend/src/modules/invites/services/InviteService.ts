/**
 * Invite Service
 * 
 * Business logic for invitation-based onboarding.
 * This is the core domain layer for the invite system.
 */

import * as InviteRepository from '../repositories/InviteRepository';
import * as UserRepository from '../../iam/repositories/UserRepository';
import { eventBus, DomainEvents } from '../../shared/events/EventBus';
import {
  Invite,
  InviteWithInviter,
  CreateInviteInput,
  CreateInviteForEmailInput,
  CreateAdminInviteInput,
  ValidateInviteResult,
  UseInviteInput,
  UseInviteResult,
  UserInviteQuota,
  InviteAnalytics,
  UserInviteAnalytics,
} from '../types';

// ============================================================================
// CONFIGURATION
// ============================================================================

const DEFAULT_USER_INVITE_LIMIT = 3;
const ADMIN_ROLES = ['admin', 'super_admin'];

// ============================================================================
// INVITE CREATION
// ============================================================================

/**
 * Create a new invite for a regular user
 * Decreases the inviter's remaining invite count
 */
export const createInvite = async (input: CreateInviteInput): Promise<Invite> => {
  const { createdBy, createdByRole, inviterInviteCount = 0 } = input;

  // Check if user has invites remaining (skip for admins)
  if (!isAdmin(createdByRole) && inviterInviteCount <= 0) {
    throw new InviteError('NO_INVITES_REMAINING', 'You have no invites remaining', 400);
  }

  // Create the invite
  const invite = await InviteRepository.create(createdBy);

  // Decrease inviter's invite count (skip for admins)
  if (!isAdmin(createdByRole)) {
    await UserRepository.decreaseInviteCount(createdBy);
  }

  // Publish event
  await eventBus.publish(DomainEvents.INVITE_CREATED, {
    inviteId: invite.id,
    createdBy,
    token: invite.token,
  });

  return invite;
};

/**
 * Create an invite for a specific email address
 */
export const createInviteForEmail = async (
  input: CreateInviteForEmailInput
): Promise<Invite> => {
  const { createdBy, createdByRole, inviteeEmail, inviterInviteCount = 0 } = input;

  // Validate email format
  if (!isValidEmail(inviteeEmail)) {
    throw new InviteError('INVALID_EMAIL', 'Invalid email format', 400);
  }

  // Check if user has invites remaining (skip for admins)
  if (!isAdmin(createdByRole) && inviterInviteCount <= 0) {
    throw new InviteError('NO_INVITES_REMAINING', 'You have no invites remaining', 400);
  }

  // Check if email is already registered
  const existingUser = await UserRepository.findByEmail(inviteeEmail);
  if (existingUser) {
    throw new InviteError('EMAIL_ALREADY_REGISTERED', 'This email is already registered', 400);
  }

  // Create the invite with email
  const invite = await InviteRepository.createAdminInvite(createdBy, inviteeEmail);

  // Decrease inviter's invite count (skip for admins)
  if (!isAdmin(createdByRole)) {
    await UserRepository.decreaseInviteCount(createdBy);
  }

  // Publish event
  await eventBus.publish(DomainEvents.INVITE_CREATED, {
    inviteId: invite.id,
    createdBy,
    inviteeEmail,
    token: invite.token,
  });

  return invite;
};

/**
 * Create an admin invite
 * Admins can create unlimited invites with custom expiry
 */
export const createAdminInvite = async (
  input: CreateAdminInviteInput
): Promise<Invite> => {
  const { createdBy, inviteeEmail, expiresInDays } = input;

  const invite = await InviteRepository.createAdminInvite(
    createdBy,
    inviteeEmail || null,
    expiresInDays
  );

  // Publish event
  await eventBus.publish(DomainEvents.INVITE_CREATED, {
    inviteId: invite.id,
    createdBy,
    inviteeEmail,
    token: invite.token,
    isAdmin: true,
  });

  return invite;
};

// ============================================================================
// INVITE VALIDATION
// ============================================================================

/**
 * Validate an invite token
 * Called during registration to verify the invite is valid
 */
export const validateInvite = async (token: string): Promise<ValidateInviteResult> => {
  // Clean the token
  const cleanToken = token.trim();

  if (!cleanToken) {
    return { valid: false, message: 'Invite token is required' };
  }

  // Find invite with inviter details
  const invite = await InviteRepository.findByTokenWithInviter(cleanToken);

  if (!invite) {
    return { valid: false, message: 'Invalid invite token' };
  }

  // Check if already used
  if (invite.status === 'used') {
    return { valid: false, message: 'This invite has already been used' };
  }

  // Check if revoked
  if (invite.status === 'revoked') {
    return { valid: false, message: 'This invite has been revoked' };
  }

  // Check if expired
  if (new Date() > new Date(invite.expiresAt)) {
    return { valid: false, message: 'This invite has expired' };
  }

  return {
    valid: true,
    invite,
  };
};

// ============================================================================
// INVITE USAGE
// ============================================================================

/**
 * Use an invite token
 * Called after successful user registration
 */
export const useInvite = async (input: UseInviteInput): Promise<UseInviteResult> => {
  const { token, userId, userEmail } = input;

  // Validate first
  const validation = await validateInvite(token);
  if (!validation.valid) {
    return { success: false, message: validation.message };
  }

  // Mark invite as used
  const invite = await InviteRepository.markAsUsed(token, userId);

  if (!invite) {
    return { success: false, message: 'Failed to use invite. It may have expired.' };
  }

  // Award invite credits to new user
  await UserRepository.setInviteCount(userId, DEFAULT_USER_INVITE_LIMIT);

  // Publish event
  await eventBus.publish(DomainEvents.INVITE_USED, {
    inviteId: invite.id,
    usedBy: userId,
    userEmail,
    invitedBy: invite.createdBy,
  });

  return {
    success: true,
    invite,
  };
};

// ============================================================================
// INVITE MANAGEMENT
// ============================================================================

/**
 * Get invites created by a user
 */
export const getUserInvites = async (userId: string): Promise<Invite[]> => {
  return InviteRepository.findByCreator(userId);
};

/**
 * Revoke an invite
 */
export const revokeInvite = async (
  inviteId: string,
  userId: string,
  isAdmin: boolean = false
): Promise<Invite> => {
  let invite: Invite | null;

  if (isAdmin) {
    invite = await InviteRepository.revokeAsAdmin(inviteId);
  } else {
    invite = await InviteRepository.revoke(inviteId, userId);
  }

  if (!invite) {
    throw new InviteError('REVOKE_FAILED', 'Invite not found or already processed', 404);
  }

  // Refund the invite credit if it was pending
  if (!isAdmin) {
    await UserRepository.increaseInviteCount(userId);
  }

  // Publish event
  await eventBus.publish(DomainEvents.INVITE_REVOKED, {
    inviteId,
    revokedBy: userId,
    isAdmin,
  });

  return invite;
};

// ============================================================================
// USER INVITE QUOTA
// ============================================================================

/**
 * Get user's invite quota
 */
export const getUserInviteQuota = async (userId: string): Promise<UserInviteQuota> => {
  const user = await UserRepository.findById(userId);

  if (!user) {
    throw new InviteError('USER_NOT_FOUND', 'User not found', 404);
  }

  const isUnlimited = isAdmin(user.role);
  const used = await InviteRepository.countUsedByCreator(userId);
  const remaining = isUnlimited ? Infinity : (user.invitesRemaining ?? 0);
  const total = isUnlimited ? Infinity : used + (user.invitesRemaining ?? 0);

  return {
    userId,
    remaining: isUnlimited ? -1 : remaining,
    used,
    total: isUnlimited ? -1 : total,
    isUnlimited,
  };
};

// ============================================================================
// ADMIN ANALYTICS
// ============================================================================

/**
 * Get invite analytics (admin only)
 */
export const getInviteAnalytics = async (): Promise<InviteAnalytics> => {
  const stats = await InviteRepository.getAnalytics();

  const conversionRate =
    stats.total > 0 ? Math.round((stats.used / stats.total) * 100) : 0;

  return {
    totalInvites: stats.total,
    usedInvites: stats.used,
    pendingInvites: stats.pending,
    expiredInvites: stats.expired,
    revokedInvites: stats.revoked,
    conversionRate,
  };
};

/**
 * Get user invite analytics (admin only)
 */
export const getUserInviteAnalytics = async (): Promise<UserInviteAnalytics[]> => {
  const data = await InviteRepository.getUserAnalytics();

  return data.map(item => ({
    ...item,
    conversionRate:
      item.invitesSent > 0
        ? Math.round((item.invitesAccepted / item.invitesSent) * 100)
        : 0,
  }));
};

// ============================================================================
// CLEANUP
// ============================================================================

/**
 * Clean up expired invites
 */
export const cleanupExpiredInvites = async (): Promise<number> => {
  return InviteRepository.markExpired();
};

// ============================================================================
// EXTERNAL API (for Auth module)
// ============================================================================

/**
 * Validate invite token (external API for Auth module)
 */
export const validateInviteExternal = async (token: string): Promise<ValidateInviteResult> => {
  return validateInvite(token);
};

/**
 * Use invite (external API for Auth module)
 */
export const useInviteExternal = async (
  token: string,
  userId: string,
  userEmail: string
): Promise<UseInviteResult> => {
  return useInvite({ token, userId, userEmail });
};

// ============================================================================
// HELPERS
// ============================================================================

const isAdmin = (role: string): boolean => {
  return ADMIN_ROLES.includes(role);
};

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// ============================================================================
// CUSTOM ERROR
// ============================================================================

export class InviteError extends Error {
  public code: string;
  public statusCode: number;

  constructor(code: string, message: string, statusCode: number = 400) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.name = 'InviteError';
  }
}
