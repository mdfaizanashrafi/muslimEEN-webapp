/**
 * Verification Controller
 * Handles user verification (biometric, two-witness, business)
 */

import { Request, Response, NextFunction } from 'express';
import {
  requestBiometricVerification as requestBiometricService,
  completeBiometricVerification as completeBiometricService,
  requestWitnessVerification as requestWitnessService,
  approveWitness as approveWitnessService,
  requestBusinessVerification as requestBusinessService,
  approveBusinessVerification as approveBusinessService,
} from './verification.service';
import {
  BiometricCompleteRequest,
  WitnessVerificationRequest,
  WitnessApproveRequest,
  BusinessVerificationRequest,
  BusinessApproveRequest,
  ErrorResponse,
} from './verification.types';

/**
 * Request biometric verification
 * POST /verification/biometric/request
 */
export const requestBiometricVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await requestBiometricService(req.session as Record<string, any>);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Complete biometric verification
 * POST /verification/biometric/complete
 */
export const completeBiometricVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { credential } = req.body as BiometricCompleteRequest;

    const result = await completeBiometricService(
      req.user!.id,
      credential,
      req.user!.badges || []
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Request two-witness verification
 * POST /verification/witness/request
 */
export const requestWitnessVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { witnessIds } = req.body as WitnessVerificationRequest;

    const result = await requestWitnessService(
      req.user!.id,
      req.user!.badges || [],
      req.user!.fullName,
      req.user!.trustScore,
      witnessIds
    );

    res.json(result);
  } catch (error) {
    const errorMessage = (error as Error).message;

    if (errorMessage.startsWith('ALREADY_VERIFIED')) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'ALREADY_VERIFIED',
          message: 'Already has two-witness verification',
        },
      };
      res.status(400).json(errorResponse);
      return;
    }

    if (errorMessage.startsWith('INVALID_WITNESSES')) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'INVALID_WITNESSES',
          message: errorMessage.includes('Exactly 2')
            ? 'Exactly 2 witnesses required'
            : 'One or more witnesses not found',
        },
      };
      res.status(400).json(errorResponse);
      return;
    }

    if (errorMessage.startsWith('INELIGIBLE_WITNESS')) {
      const witnessId = errorMessage.split(':')[1]?.trim().split(' ')[0] || '';
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'INELIGIBLE_WITNESS',
          message: `Witness ${witnessId} is not eligible to witness`,
        },
      };
      res.status(400).json(errorResponse);
      return;
    }

    next(error);
  }
};

/**
 * Submit witness approval
 * POST /verification/witness/approve
 */
export const approveWitness = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.body as WitnessApproveRequest;

    const result = await approveWitnessService(req.user!.id, userId);

    res.json(result);
  } catch (error) {
    const errorMessage = (error as Error).message;

    if (errorMessage.startsWith('NOT_FOUND')) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Witness request not found',
        },
      };
      res.status(404).json(errorResponse);
      return;
    }

    next(error);
  }
};

/**
 * Submit business verification request
 * POST /verification/business/request
 */
export const requestBusinessVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { documents } = req.body as BusinessVerificationRequest;

    const result = await requestBusinessService(req.user!.id, documents);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Approve business verification (admin only)
 * POST /verification/business/approve
 */
export const approveBusinessVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.body as BusinessApproveRequest;

    const result = await approveBusinessService(userId);

    res.json(result);
  } catch (error) {
    next(error);
  }
};
