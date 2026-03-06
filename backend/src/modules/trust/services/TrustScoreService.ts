/**
 * Trust Score Service
 * Calculates and manages trust scores
 */

import * as TrustScoreRepository from '../repositories/TrustScoreRepository';
import { eventBus, DomainEvents } from '../../shared/events/EventBus';

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
  factors: any[];
  witnessEligibilityChanged: boolean;
  isNowWitnessEligible: boolean;
}

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
};

/**
 * Get current trust score
 */
export const getCurrentScore = async (userId: string): Promise<number> => {
  return TrustScoreRepository.getCurrentScore(userId);
};

/**
 * Get score factors breakdown
 */
export const getScoreFactors = async (userId: string): Promise<any[]> => {
  const latest = await TrustScoreRepository.getLatestFactors(userId);
  if (!latest) return [];
  
  return [
    { name: 'Profile Completeness', value: latest.profileCompleteness, max: POINTS.PROFILE_COMPLETENESS_MAX },
    { name: 'Connection Quality', value: latest.connectionQuality, max: POINTS.CONNECTION_QUALITY_MAX },
    { name: 'Community Contributions', value: latest.communityContributions, max: POINTS.COMMUNITY_CONTRIBUTIONS_MAX },
    { name: 'Verification Level', value: latest.verificationLevel, max: POINTS.VERIFICATION_ADVANCED },
    { name: 'Endorsements', value: latest.endorsements, max: POINTS.ENDORSEMENT_MAX },
  ];
};

/**
 * Recalculate trust score
 */
export const recalculate = async (userId: string): Promise<RecalculationResult> => {
  // Get current score
  const previousScore = await TrustScoreRepository.getCurrentScore(userId);

  // Gather metrics (from various sources)
  const metrics = await gatherMetrics(userId);

  // Calculate factors
  const factors = calculateFactors(metrics);

  // Calculate total score
  const newScore = Math.min(1000, Math.max(0,
    factors.profileCompleteness +
    factors.connectionQuality +
    factors.communityContributions +
    factors.verificationLevel +
    factors.endorsements +
    (factors.successfulInvites * POINTS.INVITE_SUCCESS) +
    (factors.failedInvites * POINTS.INVITE_FAILURE)
  ));

  const changed = newScore !== previousScore;

  // Check witness eligibility (score >= 200)
  const wasEligible = previousScore >= 200;
  const isNowEligible = newScore >= 200;
  const witnessEligibilityChanged = wasEligible !== isNowEligible;

  // Save if changed
  if (changed) {
    await TrustScoreRepository.saveScore(userId, newScore, factors);

    // Publish event
    await eventBus.publish(DomainEvents.TRUST_SCORE_UPDATED, {
      userId,
      oldScore: previousScore,
      newScore,
      factors,
      timestamp: new Date(),
    });

    if (witnessEligibilityChanged) {
      await eventBus.publish(DomainEvents.WITNESS_ELIGIBILITY_CHANGED, {
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
    factors: formatFactors(factors),
    witnessEligibilityChanged,
    isNowWitnessEligible: isNowEligible,
  };
};

/**
 * Get trust score history
 */
export const getHistory = async (userId: string): Promise<any[]> => {
  return TrustScoreRepository.getHistory(userId);
};

// ============================================================================
// PRIVATE HELPERS
// ============================================================================

async function gatherMetrics(userId: string): Promise<any> {
  // This would gather data from various repositories
  // For now, using TrustScoreRepository as aggregate
  return TrustScoreRepository.getUserMetrics(userId);
}

function calculateFactors(metrics: any): TrustScoreFactors {
  return {
    profileCompleteness: Math.min(POINTS.PROFILE_COMPLETENESS_MAX, metrics.profileCompleteness || 0),
    connectionQuality: Math.min(POINTS.CONNECTION_QUALITY_MAX, metrics.connectionQuality || 0),
    communityContributions: Math.min(POINTS.COMMUNITY_CONTRIBUTIONS_MAX, metrics.communityContributions || 0),
    verificationLevel: getVerificationPoints(metrics.verificationTier),
    endorsements: Math.min(POINTS.ENDORSEMENT_MAX, metrics.endorsements || 0),
    successfulInvites: metrics.successfulInvites || 0,
    failedInvites: metrics.failedInvites || 0,
  };
}

function getVerificationPoints(tier: string): number {
  switch (tier) {
    case 'advanced': return POINTS.VERIFICATION_ADVANCED;
    case 'standard': return POINTS.VERIFICATION_STANDARD;
    case 'basic': return POINTS.VERIFICATION_BASIC;
    default: return 0;
  }
}

function formatFactors(factors: TrustScoreFactors): any[] {
  return [
    { name: 'Profile Completeness', impact: factors.profileCompleteness, positive: factors.profileCompleteness > 0 },
    { name: 'Connection Quality', impact: factors.connectionQuality, positive: factors.connectionQuality > 0 },
    { name: 'Community Contributions', impact: factors.communityContributions, positive: factors.communityContributions > 0 },
    { name: 'Verification Level', impact: factors.verificationLevel, positive: factors.verificationLevel > 0 },
    { name: 'Endorsements', impact: factors.endorsements, positive: factors.endorsements > 0 },
  ];
}
