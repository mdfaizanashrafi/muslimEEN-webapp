/**
 * Invitations Module
 * 
 * Responsibilities:
 * - Invitation creation and management
 * - Invitation validation for registration
 * - Invitation revocation
 * - Trust score integration for inviters
 */

// Controllers
export * as InvitationController from './controllers/InvitationController';

// Services
export * as InvitationService from './services/InvitationService';
export { validateInvitationExternal, acceptInvitationExternal } from './services/InvitationValidationService';

// Repositories
export * as InvitationRepository from './repositories/InvitationRepository';

// Types
export { CreateInvitationData, Invitation, InvitationError } from './services/InvitationService';
