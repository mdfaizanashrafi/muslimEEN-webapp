/**
 * Invitation Validation Service
 * Provides external validation for Auth module
 */

import * as InvitationRepository from '../repositories/InvitationRepository';

/**
 * Validate invitation (external API for Auth module)
 */
export const validateInvitationExternal = async (code: string): Promise<any> => {
  return InvitationRepository.validateByCode(code);
};

/**
 * Accept invitation (external API for Auth module)
 */
export const acceptInvitationExternal = async (code: string, userId: string): Promise<void> => {
  await InvitationRepository.markAsUsed(code, userId);
};
