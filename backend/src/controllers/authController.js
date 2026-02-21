/**
 * Authentication Controller
 * Handles login, logout, and invitation validation
 */

const User = require('../models/User');
const Invitation = require('../models/Invitation');
const TrustScore = require('../models/TrustScore');
const { generateToken } = require('../middleware/auth');
const logger = require('../utils/logger');
const crypto = require('crypto');

// Generate CSRF token
const generateCsrfToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Validate invitation code
 * POST /api/auth/validate-invitation
 */
const validateInvitation = async (req, res, next) => {
  try {
    const { invitationCode } = req.body;

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
const login = async (req, res, next) => {
  try {
    const { email, password, invitationCode } = req.body;

    // Find user
    const user = await User.findByEmail(email);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    }

    // Verify password
    const isValidPassword = await User.verifyPassword(user, password);
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    }

    // Update last login
    await User.update(user.id, { last_login: new Date() });

    // Generate token
    const token = generateToken(user);

    // Remove password hash from response
    const { passwordHash, ...userWithoutPassword } = user;

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
const register = async (req, res, next) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      invitationCode
    } = req.body;

    // Validate invitation
    const invitationResult = await Invitation.validate(invitationCode);
    
    if (!invitationResult.valid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INVITATION',
          message: invitationResult.message
        }
      });
    }

    // Check if email matches invitation
    if (invitationResult.invitation.inviteeEmail !== email.toLowerCase()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'EMAIL_MISMATCH',
          message: 'Email does not match the invitation'
        }
      });
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'User already exists'
        }
      });
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
const logout = async (req, res, next) => {
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
const getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.getFullProfile(req.user.id);

    res.json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  validateInvitation,
  login,
  register,
  logout,
  getCurrentUser
};
