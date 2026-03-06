/**
 * Authentication Service
 * Core identity and access management business logic
 */

import * as UserRepository from '../repositories/UserRepository';
import * as JwtService from './JwtService';
import * as PasswordService from './PasswordService';
import { generateCsrfToken } from '../../shared/utils/security';
import { eventBus, DomainEvents } from '../../shared/events/EventBus';
import { UserRole, VerificationTier } from '../../../types';

// ============================================================================
// TYPES
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
  invitationCode: string;
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
    isWitnessEligible: boolean;
  };
  token: string;
  csrfToken: string;
}

// ============================================================================
// LOGIN
// ============================================================================

/**
 * Authenticate user with credentials
 */
export const login = async (credentials: LoginCredentials): Promise<AuthResult> => {
  const { email, password } = credentials;

  // Find user by email
  const user = await UserRepository.findByEmail(email);
  if (!user) {
    throw new AuthError('INVALID_CREDENTIALS', 'Invalid email or password');
  }

  // Verify password
  const isValidPassword = await PasswordService.verifyPassword(password, user.passwordHash || '');
  if (!isValidPassword) {
    throw new AuthError('INVALID_CREDENTIALS', 'Invalid email or password');
  }

  // Check if account is active
  if (!user.isActive) {
    throw new AuthError('ACCOUNT_DISABLED', 'Account has been disabled');
  }

  // Update last login (fire and forget)
  UserRepository.updateLastLogin(user.id).catch(() => {});

  // Generate tokens
  const token = JwtService.generateToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  const csrfToken = generateCsrfToken();

  // Remove sensitive data
  const { passwordHash, ...publicUser } = user as any;

  // Publish event
  eventBus.publish(DomainEvents.USER_AUTHENTICATED, {
    userId: user.id,
    email: user.email,
    timestamp: new Date(),
  });

  return {
    user: publicUser,
    token,
    csrfToken,
  };
};

// ============================================================================
// REGISTRATION
// ============================================================================

/**
 * Register new user with invitation
 */
export const register = async (data: RegisterData): Promise<AuthResult> => {
  const { email, password, firstName, lastName, invitationCode } = data;

  // Note: Invitation validation is delegated to Invitations module
  // This is a temporary coupling until full modularization
  const { validateInvitationExternal } = await import('../../invitations/services/InvitationValidationService');
  const invitationResult = await validateInvitationExternal(invitationCode);
  
  if (!invitationResult.valid) {
    throw new AuthError('INVALID_INVITATION', invitationResult.message || 'Invalid invitation code');
  }

  // Check email matches invitation
  if (invitationResult.invitation!.inviteeEmail !== email.toLowerCase()) {
    throw new AuthError('EMAIL_MISMATCH', 'Email does not match the invitation');
  }

  // Check if user already exists
  const existingUser = await UserRepository.findByEmail(email);
  if (existingUser) {
    throw new AuthError('USER_EXISTS', 'User already exists');
  }

  // Hash password
  const passwordHash = await PasswordService.hashPassword(password);

  // Create user
  const user = await UserRepository.create({
    email,
    passwordHash,
    firstName,
    lastName,
    role: 'muslim_unverified' as UserRole,
    verificationTier: 'basic' as VerificationTier,
  });

  // Mark invitation as accepted
  const { acceptInvitationExternal } = await import('../../invitations/services/InvitationValidationService');
  await acceptInvitationExternal(invitationCode, user.id);

  // Generate tokens
  const token = JwtService.generateToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  const csrfToken = generateCsrfToken();

  // Publish event
  await eventBus.publish(DomainEvents.USER_REGISTERED, {
    userId: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    invitedBy: invitationResult.invitation!.createdBy,
  });

  return {
    user,
    token,
    csrfToken,
  };
};

// ============================================================================
// LOGOUT
// ============================================================================

/**
 * Logout user
 */
export const logout = async (_userId: string): Promise<void> => {
  // Currently stateless - no server-side action needed
  // Future: Add token to Redis blacklist
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
// VALIDATION
// ============================================================================

/**
 * Validate invitation code (delegated to Invitations module)
 */
export const validateInvitation = async (code: string) => {
  const { validateInvitationExternal } = await import('../../invitations/services/InvitationValidationService');
  return validateInvitationExternal(code);
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
// RESPONSE FORMATTERS
// ============================================================================

export const formatLoginResponse = (result: AuthResult): any => ({
  success: true,
  message: 'Login successful',
  token: result.token,
  csrfToken: result.csrfToken,
  user: result.user,
});

export const formatRegisterResponse = (result: AuthResult): any => ({
  success: true,
  message: 'Registration successful',
  token: result.token,
  csrfToken: result.csrfToken,
  user: result.user,
});
