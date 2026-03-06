/**
 * Trust Score Service
 * Orchestrates trust score calculation and management
 * Coordinates calculation, updates, and witness eligibility
 */

import User from '../models/User';
import TrustScore from '../models/TrustScore';
import { TrustScoreResponse, TrustScoreFactor, TrustScoreHistoryResponse } from '../types/api';

// ============================================================================
// TYPES
// ============================================================================

export interface TrustScoreFactors {
  profileCompleteness: number;
  connectionQuality: number;
  communityContributions: number;
  verificationLevel: number;
  endorsements: number;
  successfulInvites: number;
  failedInvites: number;
}

export interface RecalculationResult {
  score: number;
  previousScore: number;
  changed: boolean;
  factors: TrustScoreFactor[];
  witnessEligibilityChanged: boolean;
  isNowWitnessEligible: boolean;
}

// ============================================================================
// RECALCULATION
// ============================================================================

/**
 * Recalculate trust score for user
 * This is the main orchestration function that:
 * 1. Gets current user data
 * 2. Calculates all factors
 * 3. Determines new score
 * 4. Updates user record if changed
 * 5. Updates witness eligibility if needed
 * @param userId User ID
 * @returns Recalculation result with change info
 */
export const recalculate = async (userId: string): Promise<RecalculationResult> => {
  // Get user data
  const user = await User.getFullProfile(userId);
  if (!user) {
    throw new TrustScoreError('USER_NOT_FOUND', 'User not found', 404);
  }

  const previousScore = user.trustScore || 0;

  // Get metrics from TrustScore model
  const metrics = await TrustScore.getUserMetrics(userId);

  // Calculate individual factors
  const factors = calculateFactors(user, metrics);

  // Calculate total score
  const newScore = TrustScore.calculate({
    profileCompleteness: factors.profileCompleteness,
    connectionQuality: factors.connectionQuality,
    communityContributions: factors.communityContributions,
    verificationLevel: factors.verificationLevel,
    endorsements: factors.endorsements,
    successfulInvites: factors.successfulInvites,
    failedInvites: factors.failedInvites,
  });

  const changed = newScore !== previousScore;
  let witnessEligibilityChanged = false;
  let isNowWitnessEligible = user.isWitnessEligible || false;

  // Only update if score changed
  if (changed) {
    // Update trust score in database
    await User.updateTrustScore(userId, newScore, {
      profileCompleteness: factors.profileCompleteness,
      connectionQuality: factors.connectionQuality,
      communityContributions: factors.communityContributions,
      verificationLevel: factors.verificationLevel,
      endorsements: factors.endorsements,
      successfulInvites: factors.successfulInvites,
      failedInvites: factors.failedInvites,
    });

    // Check witness eligibility
    const newWitnessEligibility = newScore >= 200;
    if (newWitnessEligibility !== user.isWitnessEligible) {
      await User.update(userId, { is_witness_eligible: newWitnessEligibility });
      witnessEligibilityChanged = true;
      isNowWitnessEligible = newWitnessEligibility;
    }
  }

  // Format factors for response
  const formattedFactors: TrustScoreFactor[] = [
    { name: 'Profile Completeness', impact: factors.profileCompleteness, positive: factors.profileCompleteness > 0, percentage: Math.round((factors.profileCompleteness / 100) * 100) },
    { name: 'Connection Quality', impact: factors.connectionQuality, positive: factors.connectionQuality > 0, percentage: Math.round((factors.connectionQuality / 50) * 100) },
    { name: 'Community Contributions', impact: factors.communityContributions, positive: factors.communityContributions > 0, percentage: Math.round((factors.communityContributions / 50) * 100) },
    { name: 'Verification Level', impact: factors.verificationLevel, positive: factors.verificationLevel > 0, percentage: 100 },
    { name: 'Endorsements', impact: factors.endorsements, positive: factors.endorsements > 0, percentage: Math.round((factors.endorsements / 100) * 100) },
  ];

  return {
    score: newScore,
    previousScore,
    changed,
    factors: formattedFactors,
    witnessEligibilityChanged,
    isNowWitnessEligible,
  };
};

/**
 * Calculate all trust score factors
 * @param user User data
 * @param metrics User metrics
 * @returns Factor values
 */
const calculateFactors = (user: any, metrics: any): TrustScoreFactors => {
  return {
    profileCompleteness: TrustScore.calculateProfileCompleteness(user),
    connectionQuality: Math.min(TrustScore.POINTS.CONNECTION_QUALITY_MAX, metrics.connectionQuality),
    communityContributions: Math.min(TrustScore.POINTS.COMMUNITY_CONTRIBUTIONS_MAX, metrics.communityContributions),
    verificationLevel: TrustScore.getVerificationPoints(user.verificationTier),
    endorsements: Math.min(TrustScore.POINTS.ENDORSEMENT_MAX, user.endorsements || 0),
    successfulInvites: metrics.successfulInvites,
    failedInvites: metrics.failedInvites,
  };
};

// ============================================================================
// GETTERS
// ============================================================================

/**
 * Get current trust score for user (without recalculation)
 * @param userId User ID
 * @returns Current trust score
 */
export const getCurrentScore = async (userId: string): Promise<number> => {
  const user = await User.findById(userId);
  if (!user) {
    throw new TrustScoreError('USER_NOT_FOUND', 'User not found', 404);
  }
  return user.trustScore || 0;
};

/**
 * Get trust score history
 * @param userId User ID
 * @returns Trust score history entries
 */
export const getHistory = async (userId: string): Promise<TrustScoreHistoryResponse> => {
  const history = await User.getTrustScoreHistory(userId);
  return {
    success: true,
    history: history.map(historyEntry => ({
      date: historyEntry.date,
      score: historyEntry.score,
      factors: historyEntry.factors,
    })),
  };
};

/**
 * Check if user is witness eligible
 * @param userId User ID
 * @returns Witness eligibility status
 */
export const checkWitnessEligibility = async (userId: string): Promise<boolean> => {
  const user = await User.findById(userId);
  if (!user) {
    throw new TrustScoreError('USER_NOT_FOUND', 'User not found', 404);
  }
  return user.isWitnessEligible || false;
};

// ============================================================================
// RESPONSE FORMATTERS
// ============================================================================

/**
 * Format recalculation result for response
 */
export const formatTrustScoreResponse = (
  score: number, 
  factors: TrustScoreFactor[]
): TrustScoreResponse => ({
  success: true,
  score,
  maxScore: 1000,
  tier: score >= 700 ? 'high' : score >= 200 ? 'medium' : 'low',
  factors,
});

// ============================================================================
// CUSTOM ERROR
// ============================================================================

export class TrustScoreError extends Error {
  public code: string;
  public statusCode: number;

  constructor(code: string, message: string, statusCode: number = 400) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.name = 'TrustScoreError';
  }
}
