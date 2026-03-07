/**
 * Trust Score Controller
 * HTTP request handling for trust score operations
 * Responsibilities: Extract HTTP data, delegate to TrustScoreService, format responses
 */

import { Request, Response, NextFunction } from 'express';
import * as TrustScoreService from '../services/TrustScoreService';
import logger from '../utils/logger';

// ============================================================================
// TRUST SCORE
// ============================================================================

/**
 * Retrieve current user's trust score with factors
 * GET /user/trust-score
 */
export const retrieveCurrentTrustScore = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authenticatedUserId = req.user!.id;
    const currentTrustScore = await TrustScoreService.getCurrentScore(authenticatedUserId);
    const trustScoreHistory = await TrustScoreService.getHistory(authenticatedUserId);

    res.json({
      success: true,
      score: currentTrustScore,
      history: trustScoreHistory.history.slice(0, 1)[0]?.factors || [],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Trigger recalculation of trust score
 * POST /user/trust-score/recalculate
 */
export const triggerTrustScoreRecalculation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authenticatedUserId = req.user!.id;
    const recalculationOutcome = await TrustScoreService.recalculate(authenticatedUserId);

    res.json({
      success: true,
      score: recalculationOutcome.score,
      changed: recalculationOutcome.changed,
      witnessEligibilityChanged: recalculationOutcome.witnessEligibilityChanged,
      factors: recalculationOutcome.factors,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve trust score change history
 * GET /user/trust-score/history
 */
export const retrieveTrustScoreHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authenticatedUserId = req.user!.id;
    const scoreHistory = await TrustScoreService.getHistory(authenticatedUserId);

    res.json(scoreHistory);
  } catch (error) {
    next(error);
  }
};
