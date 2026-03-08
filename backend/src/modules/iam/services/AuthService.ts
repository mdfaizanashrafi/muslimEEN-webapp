/**
 * Authentication Service
 * 
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

  // Publish event
  eventBus.publish(DomainEvents.USER_AUTHENTICATED, {
    userId: user.id,
    email: user.email,
    timestamp: new Date(),
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      role: user.role,
      verificationTier: user.verificationTier,
      trustScore: user.trustScore,
      invitesRemaining: user.invitesRemaining,
    },
    token,
    csrfToken,
  };
};

// ============================================================================
// REGISTRATION
// ============================================================================

/**
 * Register new user with invite token
 */
export const register = async (data: RegisterData): Promise<AuthResult> => {
  const { email, password, firstName, lastName, inviteToken } = data;

  // Validate invite token using the new invites module
  const { validateInviteExternal } = await import('../../invites/services/InviteService');
  const validationResult = await validateInviteExternal(inviteToken);
  
  if (!validationResult.valid) {
    throw new AuthError('INVALID_INVITE', validationResult.message || 'Invalid invite token');
  }

  // Check if user already exists
  const existingUser = await UserRepository.findByEmail(email);
  if (existingUser) {
    throw new AuthError('USER_EXISTS', 'User already exists with this email');
  }

  // Hash password
  const passwordHash = await PasswordService.hashPassword(password);

  // Create user with default role
  const user = await UserRepository.create({
    email,
    passwordHash,
    firstName,
    lastName,
    role: 'muslim_unverified' as UserRole,
    verificationTier: 'basic' as VerificationTier,
  });

  // Mark invite as used and award invite credits
  const { useInviteExternal } = await import('../../invites/services/InviteService');
  await useInviteExternal(inviteToken, user.id, user.email);

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
    invitedBy: validationResult.invite!.createdBy,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      role: user.role,
      verificationTier: user.verificationTier,
      trustScore: user.trustScore,
      invitesRemaining: 3, // New users get 3 invites
    },
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
 * Validate invite token (delegated to Invites module)
 */
export const validateInvitation = async (token: string) => {
  const { validateInviteExternal } = await import('../../invites/services/InviteService');
  return validateInviteExternal(token);
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
