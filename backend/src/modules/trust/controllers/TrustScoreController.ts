/**
 * Trust Score Controller
 * Handles HTTP requests for trust score management
 */

import { Request, Response, NextFunction } from 'express';
import * as TrustScoreService from '../services/TrustScoreService';

/**
 * Get current trust score (read-only)
 */
export const getCurrentTrustScore = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const trustScore = await TrustScoreService.getCurrentScore(userId);
    const factors = await TrustScoreService.getScoreFactors(userId);

    res.json({
      success: true,
      score: trustScore,
      factors,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Recalculate trust score
 */
export const recalculateCurrentTrustScore = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const result = await TrustScoreService.recalculate(userId);

    res.json({
      success: true,
      score: result.score,
      previousScore: result.previousScore,
      changed: result.changed,
      witnessEligibilityChanged: result.witnessEligibilityChanged,
      factors: result.factors,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get trust score history
 */
export const getCurrentUserTrustScoreHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const history = await TrustScoreService.getHistory(userId);

    res.json({
      success: true,
      history,
    });
  } catch (error) {
    next(error);
  }
};
