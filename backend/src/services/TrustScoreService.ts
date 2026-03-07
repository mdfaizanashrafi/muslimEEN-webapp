/**
 * Trust Score Service
 * Orchestrates trust score calculation and management
 * Coordinates calculation, updates, and witness eligibility
 */

import User from '../models/user';
import TrustScore from '../models/trustScore';
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
 * Recalculates the trust score for a user based on current platform activity.
 *
 * This is the main orchestration function that evaluates all trust factors,
 * computes a new score (0-1000), updates the user's record if changed, and
 * manages witness eligibility status. The calculation considers:
 *
 * - Profile completeness (max ~100 points)
 * - Connection quality (max ~50 points)
 * - Community contributions (max ~50 points)
 * - Verification level (tier-based points)
 * - Endorsements from other users (max ~100 points)
 * - Successful/failed invitation ratio
 *
 * Users with scores >= 200 become eligible to serve as witnesses for other
 * users' verification processes.
 *
 * @param userId - Unique identifier of the user (UUID v4 format)
 *
 * @returns Complete recalculation result with change information
 * @returns {number} result.score - New calculated trust score (0-1000)
 * @returns {number} result.previousScore - Previous trust score before recalculation
 * @returns {boolean} result.changed - Whether the score changed from previous value
 * @returns {TrustScoreFactor[]} result.factors - Detailed breakdown of scoring factors
 * @returns {boolean} result.witnessEligibilityChanged - Whether witness status changed
 * @returns {boolean} result.isNowWitnessEligible - Current witness eligibility status
 *
 * @throws {TrustScoreError} USER_NOT_FOUND - No user exists with the provided ID
 *
 * @example
 * ```typescript
 * const result = await recalculate('550e8400-e29b-41d4-a716-446655440000');
 *
 * console.log(result.score); // 450
 * console.log(result.previousScore); // 420
 * console.log(result.changed); // true
 * console.log(result.isNowWitnessEligible); // true (score >= 200)
 *
 * // Review factor breakdown
 * result.factors.forEach(factor => {
 *   console.log(`${factor.name}: ${factor.impact} points (${factor.percentage}%)`);
 * });
 * // Output:
 * // "Profile Completeness: 85 points (85%)"
 * // "Connection Quality: 40 points (80%)"
 * // ...
 * ```
 *
 * @see {@link getCurrentScore} for retrieving score without recalculation
 * @see {@link getHistory} for historical score changes
 * @see {@link checkWitnessEligibility} for witness status checking
 * @see {@link TrustScoreError} for error handling
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
 * Retrieves the current trust score for a user without triggering recalculation.
 *
 * This is a lightweight operation that fetches the cached trust score from
 * the user's record. Use this when you only need the score value without
 * the overhead of factor analysis or database updates.
 *
 * For score calculation logic, threshold checking, or witness eligibility
 * updates, use {@link recalculate} instead.
 *
 * @param userId - Unique identifier of the user (UUID v4 format)
 *
 * @returns Current trust score (0-1000), defaults to 0 if never calculated
 * @returns {number} Score value ranging from 0 (new user) to 1000 (maximum trust)
 *
 * @throws {TrustScoreError} USER_NOT_FOUND - No user exists with the provided ID
 *
 * @example
 * ```typescript
 * // Quick score lookup for display
 * const score = await getCurrentScore('550e8400-e29b-41d4-a716-446655440000');
 *
 * // Determine trust tier for UI styling
 * if (score >= 700) {
 *   console.log('High trust tier - emerald badge');
 * } else if (score >= 200) {
 *   console.log('Medium trust tier - gold badge');
 * } else {
 *   console.log('Low trust tier - ruby badge');
 * }
 * ```
 *
 * @see {@link recalculate} for full score calculation with factors
 * @see {@link getHistory} for historical score data
 * @see {@link TrustScoreError} for error handling
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
