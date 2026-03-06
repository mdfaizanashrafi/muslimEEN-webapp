/**
 * Auth Service
 * Orchestrates authentication business logic
 * Manages: login, register, logout, token generation
 */

import User from '../models/User';
import Invitation from '../models/Invitation';
import * as JwtService from './JwtService';
import * as PasswordService from './PasswordService';
import { generateCsrfToken } from '../utils/security';
import { User as UserType, UserRole, VerificationTier } from '../types';
import { LoginResponse, RegisterResponse } from '../types/api';

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
  user: UserType;
  token: string;
  csrfToken: string;
}

// ============================================================================
// LOGIN
// ============================================================================

/**
 * Authenticate user with credentials
 * @param credentials Login credentials
 * @returns Auth result with tokens
 * @throws Error if authentication fails
 */
export const login = async (credentials: LoginCredentials): Promise<AuthResult> => {
  const { email, password } = credentials;

  // Find user by email
  const user = await User.findByEmail(email);
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

  // Update last login (fire and forget - don't block response)
  User.update(user.id, { lastLogin: new Date() }).catch(() => {
    // Log error but don't fail login
  });

  // Generate tokens
  const token = JwtService.generateToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  const csrfToken = generateCsrfToken();

  // Remove sensitive data
  const { passwordHash: _passwordHash, ...publicUser } = user as UserType & { passwordHash?: string };

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
 * @param data Registration data
 * @returns Auth result with tokens
 * @throws Error if registration fails
 */
export const register = async (data: RegisterData): Promise<AuthResult> => {
  const { email, password, firstName, lastName, invitationCode } = data;

  // Validate invitation
  const invitationResult = await Invitation.validate(invitationCode);
  if (!invitationResult.valid) {
    throw new AuthError('INVALID_INVITATION', invitationResult.message || 'Invalid invitation code');
  }

  // Check email matches invitation
  if (invitationResult.invitation!.inviteeEmail !== email.toLowerCase()) {
    throw new AuthError('EMAIL_MISMATCH', 'Email does not match the invitation');
  }

  // Check if user already exists
  const existingUser = await User.findByEmail(email);
  if (existingUser) {
    throw new AuthError('USER_EXISTS', 'User already exists');
  }

  // Hash password
  const passwordHash = await PasswordService.hashPassword(password);

  // Create user
  const user = await User.create({
    email,
    passwordHash,
    firstName,
    lastName,
    role: 'muslim_unverified' as UserRole,
    verificationTier: 'basic' as VerificationTier,
  });

  // Accept invitation
  await Invitation.accept(invitationCode, user.id);

  // Note: Trust score recalculation is triggered by invitation acceptance
  // This is handled in Invitation model to maintain consistency

  // Generate tokens
  const token = JwtService.generateToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  const csrfToken = generateCsrfToken();

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
 * In stateless JWT, this is primarily client-side
 * But we can implement token blacklist if needed
 * @param userId User ID
 * @returns Success status
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
 * @param userId User ID from token
 * @returns Full user profile
 */
export const getCurrentUser = async (userId: string): Promise<UserType> => {
  const user = await User.getFullProfile(userId);
  if (!user) {
    throw new AuthError('USER_NOT_FOUND', 'User not found');
  }
  return user;
};

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate invitation code
 * @param code Invitation code
 * @returns Validation result
 */
export const validateInvitation = async (code: string) => {
  const result = await Invitation.validate(code);
  return result;
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

/**
 * Format auth result for login response
 */
export const formatLoginResponse = (result: AuthResult): LoginResponse => ({
  success: true,
  message: 'Login successful',
  token: result.token,
  csrfToken: result.csrfToken,
  user: result.user,
});

/**
 * Format auth result for register response
 */
export const formatRegisterResponse = (result: AuthResult): RegisterResponse => ({
  success: true,
  message: 'Registration successful',
  token: result.token,
  csrfToken: result.csrfToken,
  user: result.user,
});
