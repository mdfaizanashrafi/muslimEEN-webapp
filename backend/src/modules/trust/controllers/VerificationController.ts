/**
 * Verification Controller
 * Handles HTTP requests for identity verification
 */

import { Request, Response, NextFunction } from 'express';
import * as VerificationService from '../services/VerificationService';

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
 * Request witness verification
 */
export const requestWitnessVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { witnessIds } = req.body;

    await VerificationService.requestWitnessVerification(userId, witnessIds);

    res.json({
      success: true,
      message: 'Witness verification requested',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Approve as witness
 */
export const approveAsWitness = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const witnessId = req.user!.id;
    const userId = req.params.userId;

    const result = await VerificationService.approveAsWitness(userId, witnessId);

    res.json({
      success: true,
      message: 'Witness verification approved',
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

    await VerificationService.requestBusinessVerification(userId);

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
 */
export const approveBusinessVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const adminId = req.user!.id;
    const userId = req.params.userId;

    const result = await VerificationService.approveBusinessVerification(userId, adminId);

    res.json({
      success: true,
      message: 'Business verification approved',
      trustScoreChanged: result.trustScoreChanged,
    });
  } catch (error) {
    next(error);
  }
};
