/**
 * Invites Module
 * 
 * Domain module for invitation-based onboarding.
 * Replaces the witness-based approval system with a controlled invite-only growth system.
 */

// Export controller functions
export {
  createInvite,
  createAdminInvite,
  getUserInvites,
  getUserInviteQuota,
  revokeInvite,
  validateInvite,
  getInviteAnalytics,
  getUserInviteAnalytics,
  handleInviteError,
} from './controllers/InviteController';

// Export service functions
export {
  createInvite as createInviteService,
  createInviteForEmail,
  createAdminInvite as createAdminInviteService,
  validateInvite as validateInviteService,
  useInvite,
  getUserInvites as getUserInvitesService,
  revokeInvite as revokeInviteService,
  getUserInviteQuota as getUserInviteQuotaService,
  getInviteAnalytics as getInviteAnalyticsService,
  getUserInviteAnalytics as getUserInviteAnalyticsService,
  cleanupExpiredInvites,
  validateInviteExternal,
  useInviteExternal,
  InviteError,
} from './services/InviteService';

// Export repository functions
export * from './repositories/InviteRepository';

// Export types
export * from './types';
