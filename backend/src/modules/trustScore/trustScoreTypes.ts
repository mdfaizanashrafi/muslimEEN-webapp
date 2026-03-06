/**
 * Trust Score Module Types
 */

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

export class TrustScoreError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'TrustScoreError';
  }
}
