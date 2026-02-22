/**
 * Verification Controller
 * Handles biometric, witness, and business verification
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import User from '../models/User';
import TrustScore from '../models/TrustScore';
import logger from '../utils/logger';


// Biometric
export const requestBiometricVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Generate WebAuthn challenge
    const challenge = crypto.randomBytes(32).toString('base64');
    res.json({ success: true, challenge });
  } catch (error) { next(error); }
};

export const completeBiometricVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await User.update(req.user!.id, { verificationTier: 'full', biometricVerified: true });
    await TrustScore.recalculate(req.user!.id);
    res.json({ success: true, message: 'Biometric verification completed' });
  } catch (error) { next(error); }
};

// Witness
export const requestWitnessVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    res.json({ success: true, message: 'Witness verification requested' });
  } catch (error) { next(error); }
};

export const approveWitness = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await User.update(req.user!.id, { verificationTier: 'full' });
    await TrustScore.recalculate(req.user!.id);
    res.json({ success: true, message: 'Witness verification approved' });
  } catch (error) { next(error); }
};

// Business
export const requestBusinessVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    res.json({ success: true, message: 'Business verification requested' });
  } catch (error) { next(error); }
};

export const approveBusinessVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await User.update(req.params.userId, { verificationTier: 'business', role: 'business' });
    await TrustScore.recalculate(req.params.userId);
    res.json({ success: true, message: 'Business verification approved' });
  } catch (error) { next(error); }
};
