/**
 * Invites Module Types
 * 
 * NOTE: Core types are re-exported from root types.
 * Module-specific types are defined here.
 */

// Re-export core types from authoritative source
export type { 
  Invite,
  InviteWithInviter, 
  InviteStatus
} from '../../types';

// ============================================================================
// INVITE CREATION TYPES
// ============================================================================

export interface CreateInviteInput {
  createdBy: string;
  createdByRole: string;
  inviterInviteCount?: number;
}

export interface CreateInviteForEmailInput {
  createdBy: string;
  createdByRole: string;
  inviteeEmail: string;
  inviterInviteCount?: number;
}

export interface CreateAdminInviteInput {
  createdBy: string;
  inviteeEmail?: string;
  expiresInDays?: number;
}

// ============================================================================
// INVITE VALIDATION TYPES
// ============================================================================

export interface ValidateInviteResult {
  valid: boolean;
  invite?: import('../../types').InviteWithInviter;
  message?: string;
}

// ============================================================================
// INVITE USAGE TYPES
// ============================================================================

export interface UseInviteInput {
  token: string;
  userId: string;
  userEmail: string;
}

export interface UseInviteResult {
  success: boolean;
  invite?: import('../../types').Invite;
  message?: string;
}

// ============================================================================
// USER INVITE QUOTA TYPES
// ============================================================================

export interface UserInviteQuota {
  userId: string;
  remaining: number;
  used: number;
  total: number;
  isUnlimited: boolean;
}

// ============================================================================
// INVITE ANALYTICS TYPES
// ============================================================================

export interface InviteAnalytics {
  totalInvites: number;
  usedInvites: number;
  pendingInvites: number;
  expiredInvites: number;
  revokedInvites: number;
  conversionRate: number;
}

export interface UserInviteAnalytics {
  userId: string;
  userName: string;
  invitesSent: number;
  invitesAccepted: number;
  conversionRate: number;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface CreateInviteRequest {
  email?: string;
}

export interface CreateInviteResponse {
  success: boolean;
  invite: {
    id: string;
    token: string;
    inviteLink: string;
    expiresAt: Date;
  };
  remainingInvites: number;
}

export interface ValidateInviteResponse {
  valid: boolean;
  invite?: {
    id: string;
    inviterName: string;
    expiresAt: Date;
  };
  message?: string;
}

export interface InviteQuotaResponse {
  remaining: number;
  used: number;
  total: number;
  isUnlimited: boolean;
}
