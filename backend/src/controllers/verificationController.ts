/**
 * Verification Controller
 * Thin HTTP handler - delegates all logic to VerificationService
 * Responsibilities: HTTP request/response only
 */

import { Request, Response, NextFunction } from 'express';
import * as VerificationService from '../services/VerificationService';

// ============================================================================
// BIOMETRIC VERIFICATION
// ============================================================================

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
      user: result.user,
      trustScoreChanged: result.trustScoreChanged,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// WITNESS VERIFICATION
// ============================================================================

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

export const approveWitness = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const witnessId = req.user!.id;
    const userId = req.params.id;

    const result = await VerificationService.approveWitnessVerification(userId, witnessId);

    res.json({
      success: true,
      message: 'Witness verification approved',
      user: result.user,
      trustScoreChanged: result.trustScoreChanged,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// BUSINESS VERIFICATION
// ============================================================================

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
      user: result.user,
      trustScoreChanged: result.trustScoreChanged,
    });
  } catch (error) {
    next(error);
  }
};
