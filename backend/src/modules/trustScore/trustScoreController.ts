/**
 * Trust Score Controller
 * HTTP request handling for trust scores
 */

import { Request, Response, NextFunction } from 'express';
import { TrustScoreService } from './trustScoreService';
import { TrustScoreError } from './trustScoreTypes';

/**
 * Get current trust score (read-only)
 * GET /user/trust-score
 */
export const getCurrentTrustScore = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    
    const result = await TrustScoreService.getCurrentScoreWithFactors(userId);
    
    res.json({
      success: true,
      score: result.score,
      factors: result.factors,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Recalculate trust score
 * POST /user/trust-score/recalculate
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
    if (error instanceof TrustScoreError) {
      res.status(error.statusCode).json({
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
 * Get trust score history
 * GET /user/trust-score/history
 */
export const getTrustScoreHistory = async (
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
