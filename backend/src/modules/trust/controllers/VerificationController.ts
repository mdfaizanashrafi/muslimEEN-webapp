/**
 * Verification Controller
 * Handles HTTP requests for identity verification
 * 
 * NOTE: Witness verification has been removed.
 * Only biometric and business verification remain.
 * 
 * SECURITY FIXES APPLIED:
 * - Added admin authorization check for approveBusinessVerification
 * - Added proper user existence validation
 * - Added audit logging
 */

import { Request, Response, NextFunction } from 'express';
import * as VerificationService from '../services/VerificationService';
import { VerificationError } from '../services/VerificationService';
import { logger } from '../../shared/utils/logger';

/**
 * Request biometric verification
 */
export const requestBiometricVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const result = await VerificationService.requestBiometricVerification(userId);

    res.json({
      success: true,
      challenge: result.challenge,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Complete biometric verification
 */
export const completeBiometricVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const result = await VerificationService.completeBiometricVerification(userId, req.body);

    res.json({
      success: true,
      message: 'Biometric verification completed',
      trustScoreChanged: result.trustScoreChanged,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Request business verification
 */
export const requestBusinessVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { companyName, registrationNumber, documents } = req.body;

    // Validate required fields
    if (!companyName || !registrationNumber) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'Company name and registration number are required',
        },
      });
      return;
    }

    await VerificationService.requestBusinessVerification(userId, {
      companyName,
      registrationNumber,
      documents: documents || [],
    });

    res.json({
      success: true,
      message: 'Business verification requested',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Approve business verification (admin only)
 * 
 * SECURITY FIX: Added admin authorization check
 * Only users with 'admin' role can approve business verifications
 */
export const approveBusinessVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const adminId = req.user!.id;
    const userId = req.params.userId;

    // SECURITY FIX: Verify user is admin
    const userRole = req.user?.role;
    if (userRole !== 'admin') {
      logger.warn('Unauthorized attempt to approve business verification', {
        adminId,
        targetUserId: userId,
        attemptedByRole: userRole,
        ip: req.ip,
        path: req.path,
      });
      
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Admin privileges required to approve business verification',
        },
      });
      return;
    }

    // Validate userId parameter
    if (!userId || typeof userId !== 'string') {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_USER_ID',
          message: 'Valid user ID is required',
        },
      });
      return;
    }

    const result = await VerificationService.approveBusinessVerification(userId, adminId);

    // Audit log successful approval
    logger.info('Business verification approved by admin', {
      adminId,
      approvedUserId: userId,
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: 'Business verification approved',
      trustScoreChanged: result.trustScoreChanged,
    });
  } catch (error) {
    if (error instanceof VerificationError) {
      res.status(400).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
      return;
    }
    next(error);
  }
};

/**
 * Get current user's verification status
 */
export const getVerificationStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const status = await VerificationService.getVerificationStatus(userId);

    res.json({
      success: true,
      status,
    });
  } catch (error) {
    next(error);
  }
};
