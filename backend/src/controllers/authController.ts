/**
 * Authentication Controller
 * Handles login, logout, and invitation validation
 */

import { Response, NextFunction } from 'express';
import crypto from 'crypto';
import User from '../models/User';
import Invitation from '../models/Invitation';
import TrustScore from '../models/TrustScore';
import { generateToken } from '../middleware/auth';
import logger from '../utils/logger';
import { AuthenticatedRequest, ApiResponse, User as UserType } from '../types';

// Generate CSRF token
const generateCsrfToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

interface LoginBody {
  email: string;
  password: string;
  invitationCode?: string;
}

interface RegisterBody {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  invitationCode: string;
}

interface ValidateInvitationBody {
  invitationCode: string;
}

/**
 * Validate invitation code
 * POST /api/auth/validate-invitation
 */
export const validateInvitation = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { invitationCode } = req.body as ValidateInvitationBody;

    const result = await Invitation.validate(invitationCode);

    res.json({
      success: result.valid,
      message: result.message,
      ...(result.invitation && { data: { invitation: result.invitation } })
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
export const login = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body as LoginBody;

    // Find user
    const user = await User.findByEmail(email);

    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
      return;
    }

    // Verify password
    const isValidPassword = await User.verifyPassword(user, password);

    if (!isValidPassword) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
      return;
    }

    // Update last login
    await User.update(user.id, { lastLogin: new Date() });

    // Generate token
    const token = generateToken(user);

    // Remove password hash from response
    const { passwordHash, ...userWithoutPassword } = user as UserType & { passwordHash?: string };

    // Generate CSRF token for state-changing requests
    const csrfToken = generateCsrfToken();

    logger.info(`User logged in: ${user.email}`);

    res.json({
      success: true,
      token,
      csrfToken,
      user: userWithoutPassword,
      message: 'Login successful'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Register user
 * POST /api/auth/register
 */
export const register = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      invitationCode
    } = req.body as RegisterBody;

    // Validate invitation
    const invitationResult = await Invitation.validate(invitationCode);

    if (!invitationResult.valid) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INVITATION',
          message: invitationResult.message
        }
      });
      return;
    }

    // Check if email matches invitation
    if (invitationResult.invitation!.inviteeEmail !== email.toLowerCase()) {
      res.status(400).json({
        success: false,
        error: {
          code: 'EMAIL_MISMATCH',
          message: 'Email does not match the invitation'
        }
      });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email);

    if (existingUser) {
      res.status(409).json({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'User already exists'
        }
      });
      return;
    }

    // Create user
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      role: 'muslim_unverified',
      verificationTier: 'basic'
    });

    // Accept invitation
    await Invitation.accept(invitationCode, user.id);

    // Calculate initial trust score
    await TrustScore.recalculate(user.id);

    // Generate token
    const token = generateToken(user);

    // Generate CSRF token
    const csrfToken = generateCsrfToken();

    logger.info(`User registered: ${user.email}`);

    res.status(201).json({
      success: true,
      token,
      csrfToken,
      user,
      message: 'Registration successful'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout user
 * POST /api/auth/logout
 */
export const logout = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // In a stateless JWT setup, logout is handled client-side
    // But we can add token to a blacklist if needed

    logger.info(`User logged out: ${req.user?.email || 'unknown'}`);

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user
 * GET /api/auth/me
 */
export const getCurrentUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await User.getFullProfile(req.user!.id);

    res.json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};
