/**
 * Auth Service
 * Orchestrates authentication business logic
 * Manages: login, register, logout, token generation
 */

import User from '../models/user';
import Invitation from '../models/invitation';
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
 * Authenticates a user with email and password credentials.
 *
 * Validates credentials against stored user data and returns JWT tokens
 * upon successful authentication. Updates last login timestamp asynchronously.
 * The user must be active (isActive === true) to successfully log in.
 *
 * @param credentials - User login credentials
 * @param credentials.email - User's registered email address (case-insensitive match)
 * @param credentials.password - User's plain text password (will be compared against bcrypt hash)
 *
 * @returns Authentication result containing user data and tokens
 * @returns {User} result.user - User profile (password hash excluded for security)
 * @returns {string} result.token - JWT access token with 24-hour expiry
 * @returns {string} result.csrfToken - CSRF protection token for state-changing requests
 *
 * @throws {AuthError} INVALID_CREDENTIALS - Email not found or password incorrect
 * @throws {AuthError} ACCOUNT_DISABLED - User account has been deactivated by admin
 *
 * @example
 * ```typescript
 * const result = await login({
 *   email: 'ahmed@example.com',
 *   password: 'securePassword123'
 * });
 *
 * console.log(result.user.fullName); // "Ahmed Hassan"
 * console.log(result.token); // "eyJhbGciOiJIUzI1NiIs..."
 * console.log(result.csrfToken); // "a1b2c3d4e5f6..."
 * ```
 *
 * @see {@link register} for creating new accounts
 * @see {@link logout} for ending authenticated sessions
 * @see {@link AuthError} for error handling patterns
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
 * Registers a new user with invitation-based access control.
 *
 * MuslimEEN uses an invitation-only model to maintain community quality
 * and prevent spam. This function validates the invitation code, ensures
 * the email matches the invited address, checks for existing accounts,
 * hashes the password, creates the user record, and marks the invitation as accepted.
 *
 * New users are assigned the 'muslim_unverified' role and 'basic' verification tier
 * with an initial trust score of 0.
 *
 * @param data - Registration data with invitation
 * @param data.email - User's email address (must match invitation's inviteeEmail)
 * @param data.password - User's chosen password (will be hashed with bcrypt, 12 rounds)
 * @param data.firstName - User's first name
 * @param data.lastName - User's last name
 * @param data.invitationCode - Valid invitation code from existing member
 *
 * @returns Authentication result containing new user data and tokens
 * @returns {User} result.user - Newly created user profile
 * @returns {string} result.token - JWT access token for immediate authentication
 * @returns {string} result.csrfToken - CSRF protection token
 *
 * @throws {AuthError} INVALID_INVITATION - Invitation code is invalid, expired, or already used
 * @throws {AuthError} EMAIL_MISMATCH - Provided email doesn't match invitation's inviteeEmail
 * @throws {AuthError} USER_EXISTS - An account with this email already exists
 *
 * @example
 * ```typescript
 * const result = await register({
 *   email: 'fatima@example.com',
 *   password: 'mySecurePassword123',
 *   firstName: 'Fatima',
 *   lastName: 'Rahman',
 *   invitationCode: 'MUSLIMEEN-2024-A7B3C9D2'
 * });
 *
 * console.log(result.user.role); // "muslim_unverified"
 * console.log(result.user.verificationTier); // "basic"
 * ```
 *
 * @see {@link login} for subsequent authentication
 * @see {@link validateInvitation} for pre-registration invitation checking
 * @see {@link AuthError} for error handling patterns
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
 * Logs out a user from the application.
 *
 * In the current stateless JWT implementation, this function serves as a
 * placeholder for future token blacklist functionality. The actual logout
 * is primarily handled client-side by removing the JWT from storage.
 *
 * Future implementation will include:
 * - Redis-based token blacklist
 * - Token expiration tracking
 * - Multi-device session management
 *
 * @param _userId - User ID from authenticated session (reserved for future use)
 *
 * @returns Promise that resolves when logout processing is complete (currently immediate)
 *
 * @example
 * ```typescript
 * // Client-side logout (current implementation)
 * await logout(currentUser.id);
 * localStorage.removeItem('token');
 * localStorage.removeItem('csrfToken');
 * // Redirect to login page
 * ```
 *
 * @see {@link login} for session establishment
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
