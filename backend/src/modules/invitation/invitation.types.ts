/**
 * Invitation Module Types
 * MuslimEEN Backend
 */

export interface Invitation {
  id: string;
  inviterId: string;
  inviteeEmail: string;
  code: string;
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
  createdAt: Date;
  expiresAt: Date;
  acceptedAt?: Date;
}

export interface InvitationCreateInput {
  inviterId: string;
  inviteeEmail: string;
}

export interface InvitationResponse {
  id: string;
  inviterId: string;
  inviteeEmail: string;
  code: string;
  status: string;
  createdAt: Date;
  expiresAt: Date;
  acceptedAt?: Date;
}

export interface ValidationResult {
  valid: boolean;
  message: string;
  invitation?: InvitationResponse;
}

export interface RemainingInvitationsResponse {
  remaining: number;
  max: number;
}

export interface InvitationError {
  code: string;
  message: string;
}
