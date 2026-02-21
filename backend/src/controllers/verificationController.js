/**
 * Verification Controller
 * Handles user verification (biometric, two-witness, business)
 */

const User = require('../models/User');
const Notification = require('../models/Notification');
const TrustScore = require('../models/TrustScore');
const logger = require('../utils/logger');

/**
 * Get verification status
 * GET /api/verification/status
 */
const getStatus = async (req, res, next) => {
  try {
    const user = await User.getFullProfile(req.user.id);

    const verificationProgress = {
      emailVerified: true, // Assumed if logged in
      biometricVerified: user.badges.includes('biometric'),
      twoWitnessVerified: user.badges.includes('two_witness'),
      businessVerified: user.badges.includes('business')
    };

    res.json({
      success: true,
      tier: user.verificationTier,
      badges: user.badges,
      progress: verificationProgress
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Request biometric verification
 * POST /api/verification/biometric/request
 */
const requestBiometricVerification = async (req, res, next) => {
  try {
    // In a real implementation, this would:
    // 1. Generate WebAuthn challenge
    // 2. Store challenge in session/cache
    // 3. Return challenge to client

    const challenge = require('crypto').randomBytes(32).toString('base64');

    // Store challenge (in production, use Redis or similar)
    req.session = req.session || {};
    req.session.biometricChallenge = challenge;

    res.json({
      success: true,
      challenge,
      message: 'Biometric verification initiated'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Complete biometric verification
 * POST /api/verification/biometric/complete
 */
const completeBiometricVerification = async (req, res, next) => {
  try {
    const { credential } = req.body;

    // In a real implementation, this would:
    // 1. Verify the credential against stored challenge
    // 2. Verify WebAuthn signature
    // 3. Store public key for future authentication

    // For now, we'll simulate successful verification
    const currentBadges = req.user.badges || [];
    
    if (!currentBadges.includes('biometric')) {
      currentBadges.push('biometric');
      
      await User.update(req.user.id, {
        badges: currentBadges,
        verification_tier: 'full'
      });

      // Recalculate trust score
      await TrustScore.recalculate(req.user.id);

      // Create notification
      await Notification.createVerificationCompleted(req.user.id, 'full');

      logger.info(`Biometric verification completed for ${req.user.id}`);
    }

    res.json({
      success: true,
      message: 'Biometric verification completed'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Request two-witness verification
 * POST /api/verification/witness/request
 */
const requestWitnessVerification = async (req, res, next) => {
  try {
    const { witnessIds } = req.body;

    // Check if user already has two-witness verification
    if (req.user.badges.includes('two_witness')) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ALREADY_VERIFIED',
          message: 'Already has two-witness verification'
        }
      });
    }

    // Validate witnesses
    if (!witnessIds || witnessIds.length !== 2) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_WITNESSES',
          message: 'Exactly 2 witnesses required'
        }
      });
    }

    // Check witnesses are eligible (trust score >= 200, verified)
    const db = require('../config/database');
    const witnessQuery = `
      SELECT id, trust_score, verification_tier, is_witness_eligible
      FROM users
      WHERE id = ANY($1)
    `;
    const witnessResult = await db.query(witnessQuery, [witnessIds]);

    if (witnessResult.rows.length !== 2) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_WITNESSES',
          message: 'One or more witnesses not found'
        }
      });
    }

    for (const witness of witnessResult.rows) {
      if (!witness.is_witness_eligible || witness.trust_score < 200) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INELIGIBLE_WITNESS',
            message: `Witness ${witness.id} is not eligible to witness`
          }
        });
      }
    }

    // Create witness requests
    const witnessRequestQuery = `
      INSERT INTO verification_witnesses (user_id, witness_id, status)
      VALUES ($1, $2, 'pending'), ($1, $3, 'pending')
      ON CONFLICT (user_id, witness_id) DO UPDATE SET status = 'pending'
    `;
    await db.query(witnessRequestQuery, [req.user.id, witnessIds[0], witnessIds[1]]);

    // Create notifications for witnesses
    for (const witnessId of witnessIds) {
      await Notification.create({
        userId: witnessId,
        type: Notification.TYPES.VERIFICATION_COMPLETED,
        title: 'Witness Request',
        message: `${req.user.fullName} requested you as a witness`,
        actorId: req.user.id,
        actorName: req.user.fullName,
        actorTrustScore: req.user.trustScore,
        actionUrl: '/verification/witness'
      });
    }

    logger.info(`Witness verification requested by ${req.user.id} from ${witnessIds.join(', ')}`);

    res.json({
      success: true,
      message: 'Witness verification requested'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit witness approval
 * POST /api/verification/witness/approve
 */
const approveWitness = async (req, res, next) => {
  try {
    const { userId } = req.body;

    // Update witness status
    const db = require('../config/database');
    const updateQuery = `
      UPDATE verification_witnesses
      SET status = 'approved', witnessed_at = NOW()
      WHERE user_id = $1 AND witness_id = $2
      RETURNING *
    `;
    const updateResult = await db.query(updateQuery, [userId, req.user.id]);

    if (updateResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Witness request not found'
        }
      });
    }

    // Check if both witnesses have approved
    const countQuery = `
      SELECT COUNT(*) as approved_count
      FROM verification_witnesses
      WHERE user_id = $1 AND status = 'approved'
    `;
    const countResult = await db.query(countQuery, [userId]);
    const approvedCount = parseInt(countResult.rows[0].approved_count);

    if (approvedCount >= 2) {
      // Grant two-witness badge
      const user = await User.findById(userId);
      const currentBadges = user.badges || [];
      
      if (!currentBadges.includes('two_witness')) {
        currentBadges.push('two_witness');
        
        await User.update(userId, {
          badges: currentBadges,
          verification_tier: 'full'
        });

        // Recalculate trust score
        await TrustScore.recalculate(userId);

        // Create notification
        await Notification.createVerificationCompleted(userId, 'full');

        logger.info(`Two-witness verification completed for ${userId}`);
      }
    }

    res.json({
      success: true,
      message: 'Witness approval recorded'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit business verification request
 * POST /api/verification/business/request
 */
const requestBusinessVerification = async (req, res, next) => {
  try {
    const { documents } = req.body;

    // In a real implementation, this would:
    // 1. Store uploaded documents
    // 2. Create admin review task
    // 3. Notify admins

    logger.info(`Business verification requested by ${req.user.id}`);

    res.json({
      success: true,
      message: 'Business verification request submitted for review'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Approve business verification (admin only)
 * POST /api/verification/business/approve
 */
const approveBusinessVerification = async (req, res, next) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId);
    const currentBadges = user.badges || [];
    
    if (!currentBadges.includes('business')) {
      currentBadges.push('business');
      
      await User.update(userId, {
        badges: currentBadges,
        verification_tier: 'business'
      });

      // Recalculate trust score
      await TrustScore.recalculate(userId);

      // Create notification
      await Notification.createVerificationCompleted(userId, 'business');

      logger.info(`Business verification approved for ${userId}`);
    }

    res.json({
      success: true,
      message: 'Business verification approved'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStatus,
  requestBiometricVerification,
  completeBiometricVerification,
  requestWitnessVerification,
  approveWitness,
  requestBusinessVerification,
  approveBusinessVerification
};
