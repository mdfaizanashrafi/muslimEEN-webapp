/**
 * Trust Score Service
 * Business logic for trust score calculation and management
 */

import { TrustScoreRepository } from './trustScoreRepository';
import { TrustScoreError, TrustScoreFactors, RecalculationResult } from './trustScoreTypes';
import { eventBus, DomainEvents } from '../shared/events/eventBus';

// Trust score calculation constants
const POINTS = {
  PROFILE_COMPLETENESS_MAX: 100,
  CONNECTION_QUALITY_MAX: 50,
  COMMUNITY_CONTRIBUTIONS_MAX: 50,
  VERIFICATION_BASIC: 100,
  VERIFICATION_STANDARD: 200,
  VERIFICATION_ADVANCED: 300,
  ENDORSEMENT_MAX: 100,
  INVITE_SUCCESS: 50,
  INVITE_FAILURE: -25,
  WITNESS_ELIGIBILITY_THRESHOLD: 200,
} as const;

/**
 * Get current trust score with factor breakdown
 */
export const getCurrentScoreWithFactors = async (userId: string): Promise<{ score: number; factors: any[] }> => {
  const score = await TrustScoreRepository.getCurrentScore(userId);
  const factors = await TrustScoreRepository.getLatestFactors(userId);
  
  return {
    score,
    factors: factors ? formatFactorsForDisplay(factors) : [],
  };
};

/**
 * Recalculate trust score based on current metrics
 */
export const recalculate = async (userId: string): Promise<RecalculationResult> => {
  // Verify user exists
  const userExists = await TrustScoreRepository.userExists(userId);
  if (!userExists) {
    throw new TrustScoreError('USER_NOT_FOUND', 'User not found', 404);
  }
  
  // Get current score before recalculation
  const previousScore = await TrustScoreRepository.getCurrentScore(userId);
  
  // Gather metrics from various sources
  const metrics = await TrustScoreRepository.getUserMetrics(userId);
  
  // Calculate individual factors
  const factors = calculateFactors(metrics);
  
  // Calculate total score
  const newScore = calculateTotalScore(factors);
  
  // Determine changes
  const changed = newScore !== previousScore;
  const wasEligible = previousScore >= POINTS.WITNESS_ELIGIBILITY_THRESHOLD;
  const isNowEligible = newScore >= POINTS.WITNESS_ELIGIBILITY_THRESHOLD;
  const witnessEligibilityChanged = wasEligible !== isNowEligible;
  
  // Save if changed
  if (changed) {
    await TrustScoreRepository.saveScore(userId, newScore, factors);
    
    // Publish domain event
    await eventBus.publish(DomainEvents.TRUST_SCORE_UPDATED, {
      userId,
      oldScore: previousScore,
      newScore,
      factors,
      timestamp: new Date(),
    });
    
    // Publish witness eligibility change if applicable
    if (witnessEligibilityChanged) {
      await eventBus.publish('trust.witness_eligibility_changed', {
        userId,
        isEligible: isNowEligible,
        timestamp: new Date(),
      });
    }
  }
  
  return {
    score: newScore,
    previousScore,
    changed,
    factors: formatFactorsForDisplay(factors),
    witnessEligibilityChanged,
    isNowWitnessEligible: isNowEligible,
  };
};

/**
 * Get trust score history
 */
export const getHistory = async (userId: string): Promise<any[]> => {
  const history = await TrustScoreRepository.getHistory(userId);
  
  return history.map((entry: any) => ({
    date: entry.createdAt,
    score: entry.score,
    factors: entry.factors,
  }));
};

// ============================================================================
// PRIVATE HELPERS
// ============================================================================

/**
 * Calculate individual score factors from metrics
 */
const calculateFactors = (metrics: any): TrustScoreFactors => {
  return {
    profileCompleteness: Math.min(POINTS.PROFILE_COMPLETENESS_MAX, metrics.profileCompleteness || 0),
    connectionQuality: Math.min(POINTS.CONNECTION_QUALITY_MAX, metrics.connectionQuality || 0),
    communityContributions: Math.min(POINTS.COMMUNITY_CONTRIBUTIONS_MAX, metrics.communityContributions || 0),
    verificationLevel: getVerificationPoints(metrics.verificationTier),
    endorsements: Math.min(POINTS.ENDORSEMENT_MAX, metrics.endorsements || 0),
    successfulInvites: metrics.successfulInvites || 0,
    failedInvites: metrics.failedInvites || 0,
  };
};

/**
 * Calculate total score from factors
 */
const calculateTotalScore = (factors: TrustScoreFactors): number => {
  const baseScore = 
    factors.profileCompleteness +
    factors.connectionQuality +
    factors.communityContributions +
    factors.verificationLevel +
    factors.endorsements;
  
  const inviteAdjustment = 
    (factors.successfulInvites * POINTS.INVITE_SUCCESS) +
    (factors.failedInvites * POINTS.INVITE_FAILURE);
  
  return Math.min(1000, Math.max(0, baseScore + inviteAdjustment));
};

/**
 * Get points for verification tier
 */
const getVerificationPoints = (tier: string): number => {
  switch (tier) {
    case 'advanced': return POINTS.VERIFICATION_ADVANCED;
    case 'standard': return POINTS.VERIFICATION_STANDARD;
    case 'basic': return POINTS.VERIFICATION_BASIC;
    default: return 0;
  }
};

/**
 * Format factors for API response
 */
const formatFactorsForDisplay = (factors: TrustScoreFactors): any[] => {
  return [
    { name: 'Profile Completeness', impact: factors.profileCompleteness, positive: factors.profileCompleteness > 0 },
    { name: 'Connection Quality', impact: factors.connectionQuality, positive: factors.connectionQuality > 0 },
    { name: 'Community Contributions', impact: factors.communityContributions, positive: factors.communityContributions > 0 },
    { name: 'Verification Level', impact: factors.verificationLevel, positive: factors.verificationLevel > 0 },
    { name: 'Endorsements', impact: factors.endorsements, positive: factors.endorsements > 0 },
    { name: 'Successful Invites', impact: factors.successfulInvites * POINTS.INVITE_SUCCESS, positive: factors.successfulInvites > 0 },
  ];
};
