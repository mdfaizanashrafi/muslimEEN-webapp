/**
 * Authentication Service
 * 
 * SIMPLIFIED: Clerk handles authentication.
 * This service now only provides:
 * - Invitation validation (for pre-signup invite checking)
 * - User lookup utilities
 * 
 * NOTE: Legacy JWT login/register/refresh removed - using Clerk exclusively
 * DATE: 2026-03-20
 */

import * as UserRepository from '../repositories/UserRepository';
import { logger } from '../../shared/utils/logger';
import { UserRole, VerificationTier } from '../../shared/types';

// ============================================================================
// TYPES (kept for backward compatibility)
// ============================================================================

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  inviteToken: string;
}

export interface AuthResult {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    fullName: string;
    role: UserRole;
    verificationTier: VerificationTier;
    trustScore: number;
    invitesRemaining: number;
  };
  token: string;
  csrfToken: string;
}

// ============================================================================
// DEPRECATED: Legacy login - returns error directing to Clerk
// ============================================================================

/**
 * DEPRECATED: Use Clerk authentication instead
 */
export const login = async (_credentials: LoginCredentials): Promise<never> => {
  throw new AuthError(
    'AUTH_METHOD_DEPRECATED',
    'Direct login is no longer supported. Use Clerk authentication.',
    501
  );
};

// ============================================================================
// DEPRECATED: Legacy register - returns error directing to Clerk
// ============================================================================

/**
 * DEPRECATED: Use Clerk SignUp component instead
 */
export const register = async (_data: RegisterData): Promise<never> => {
  throw new AuthError(
    'AUTH_METHOD_DEPRECATED',
    'Direct registration is no longer supported. Use Clerk SignUp.',
    501
  );
};

// ============================================================================
// LOGOUT (kept for audit logging purposes)
// ============================================================================

/**
 * Logout user
 * Note: Clerk handles token revocation; this is for audit logging only
 */
export const logout = async (_userId: string): Promise<void> => {
  // Clerk handles session cleanup on the client side
  // Server-side: tokens are stateless JWTs that expire naturally
  return Promise.resolve();
};

// ============================================================================
// CURRENT USER
// ============================================================================

/**
 * Get current user profile
 */
export const getCurrentUser = async (userId: string): Promise<any> => {
  const user = await UserRepository.findById(userId);
  if (!user) {
    throw new AuthError('USER_NOT_FOUND', 'User not found');
  }
  return user;
};

// ============================================================================
// DEPRECATED: Token refresh - Clerk handles this automatically
// ============================================================================

/**
 * DEPRECATED: Use Clerk's automatic token refresh
 */
export const refreshSession = async (_userId: string): Promise<never> => {
  throw new AuthError(
    'AUTH_METHOD_DEPRECATED',
    'Token refresh is handled automatically by Clerk.',
    501
  );
};

// ============================================================================
// INVITATION VALIDATION (still used for pre-signup invite checking)
// ============================================================================

/**
 * Validate invite token (delegated to Invites module)
 * This is still used by the /auth/validate-invitation endpoint
 * which is called BEFORE signup (when user doesn't have Clerk session yet)
 */
export const validateInvitation = async (code: string) => {
  const { validateInviteCode } = await import('../../invites/services/InviteService');
  return validateInviteCode(code);
};

// ============================================================================
// CUSTOM ERROR
// ============================================================================

export class AuthError extends Error {
  public code: string;
  public statusCode: number;

  constructor(code: string, message: string, statusCode: number = 400) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.name = 'AuthError';
  }
}

// ============================================================================
// RESPONSE FORMATTERS (kept for backward compatibility)
// ============================================================================

export const formatLoginResponse = (_result: AuthResult): any => ({
  success: false,
  error: {
    code: 'AUTH_METHOD_DEPRECATED',
    message: 'Direct login is no longer supported. Use Clerk authentication.',
  },
});

export const formatRegisterResponse = (_result: AuthResult): any => ({
  success: false,
  error: {
    code: 'AUTH_METHOD_DEPRECATED',
    message: 'Direct registration is no longer supported. Use Clerk SignUp.',
  },
});
