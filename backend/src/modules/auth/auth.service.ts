/**
 * Authentication Service
 * Business logic for authentication operations
 */

import crypto from 'crypto';
import { LoginRequest, RegisterRequest, ValidateInvitationRequest, UserData, AuthResponse, ValidationResult, LogoutResponse } from './auth.types';

// Generate CSRF token
const generateCsrfToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Validate invitation code
 */
export const validateInvitation = async (
  data: ValidateInvitationRequest,
  invitationModel: any
): Promise<ValidationResult> => {
  const { invitationCode } = data;
  const result = await invitationModel.validate(invitationCode);
  
  return {
    valid: result.valid,
    message: result.message,
    invitation: result.invitation
  };
};

/**
 * Login user
 */
export const login = async (
  data: LoginRequest,
  userModel: any,
  generateToken: (user: any) => string,
  logger: any
): Promise<AuthResponse | null> => {
  const { email, password } = data;

  // Find user
  const user = await userModel.findByEmail(email);

  if (!user) {
    return null;
  }

  // Verify password
  const isValidPassword = await userModel.verifyPassword(user, password);

  if (!isValidPassword) {
    return null;
  }

  // Update last login
  await userModel.update(user.id, { last_login: new Date() });

  // Generate token
  const token = generateToken(user);

  // Remove password hash from response
  const { passwordHash, ...userWithoutPassword } = user;

  // Generate CSRF token for state-changing requests
  const csrfToken = generateCsrfToken();

  logger.info(`User logged in: ${user.email}`);

  return {
    success: true,
    token,
    csrfToken,
    user: userWithoutPassword as UserData,
    message: 'Login successful'
  };
};

/**
 * Register user
 */
export const register = async (
  data: RegisterRequest,
  userModel: any,
  invitationModel: any,
  trustScoreModel: any,
  generateToken: (user: any) => string,
  logger: any
): Promise<{ success: boolean; token: string; csrfToken: string; user: UserData; message: string } | { error: { code: string; message: string } }> => {
  const {
    email,
    password,
    firstName,
    lastName,
    invitationCode
  } = data;

  // Validate invitation
  const invitationResult = await invitationModel.validate(invitationCode);

  if (!invitationResult.valid) {
    return {
      error: {
        code: 'INVALID_INVITATION',
        message: invitationResult.message
      }
    };
  }

  // Check if email matches invitation
  if (invitationResult.invitation.inviteeEmail !== email.toLowerCase()) {
    return {
      error: {
        code: 'EMAIL_MISMATCH',
        message: 'Email does not match the invitation'
      }
    };
  }

  // Check if user already exists
  const existingUser = await userModel.findByEmail(email);

  if (existingUser) {
    return {
      error: {
        code: 'USER_EXISTS',
        message: 'User already exists'
      }
    };
  }

  // Create user
  const user = await userModel.create({
    email,
    password,
    firstName,
    lastName,
    role: 'muslim_unverified',
    verificationTier: 'basic'
  });

  // Accept invitation
  await invitationModel.accept(invitationCode, user.id);

  // Calculate initial trust score
  await trustScoreModel.recalculate(user.id);

  // Generate token
  const token = generateToken(user);

  // Generate CSRF token
  const csrfToken = generateCsrfToken();

  logger.info(`User registered: ${user.email}`);

  return {
    success: true,
    token,
    csrfToken,
    user: user as UserData,
    message: 'Registration successful'
  };
};

/**
 * Logout user
 */
export const logout = async (
  userEmail: string | undefined,
  logger: any
): Promise<LogoutResponse> => {
  // In a stateless JWT setup, logout is handled client-side
  // But we can add token to a blacklist if needed

  logger.info(`User logged out: ${userEmail || 'unknown'}`);

  return {
    success: true,
    message: 'Logout successful'
  };
};

/**
 * Get current user
 */
export const getCurrentUser = async (
  userId: string,
  userModel: any
): Promise<{ user: any } | null> => {
  const user = await userModel.getFullProfile(userId);
  
  if (!user) {
    return null;
  }

  return { user };
};
