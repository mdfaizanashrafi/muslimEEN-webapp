/**
 * Invites Module - ELITE PRODUCTION GRADE
 * 
 * Domain module for invitation-based onboarding.
 * Controlled invite-only growth system with full security.
 * 
 * DATE: 2026-03-21
 */

import * as InviteController from './controllers/InviteControllerHardened';

// Export controller as object (standard pattern)
export { InviteController };

// Export individual controller functions
export {
  createInvite,
  getUserInvites,
  getUserInviteQuota,
  revokeInvite,
  validateInvite,
} from './controllers/InviteControllerHardened';

// Export service functions
export {
  createInvite as createInviteService,
  validateInviteCode as validateInviteCodeService,
  consumeInvite as consumeInviteService,
  getUserInvites as getUserInvitesService,
  revokeInvite as revokeInviteService,
  getUserInviteQuota as getUserInviteQuotaService,
  CreateInviteResult,
  ValidateInviteResult,
  ConsumeInviteResult,
  InviteQuota,
} from './services/InviteService';

// Export token service
export {
  generateInviteJWT,
  verifyInviteJWT,
  generateInviteCode,
  hashInviteCode,
} from './services/InviteTokenService';

// Export repository functions
export * from './repositories/InviteRepository';

// Export types
export * from './types';
