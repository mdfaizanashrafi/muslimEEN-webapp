/**
 * Trust Score Model Mock
 * Mock implementations of Trust Score model for unit testing
 */

export const mockTrustScoreModel = {
  calculate: jest.fn(),
  calculateProfileCompleteness: jest.fn(),
  getVerificationPoints: jest.fn(),
  recalculate: jest.fn(),
  getUserMetrics: jest.fn(),
  MAX_SCORE: 1000,
  MIN_SCORE: 0,
  POINTS: {
    PROFILE_COMPLETENESS_MAX: 100,
    CONNECTION_QUALITY_MAX: 50,
    COMMUNITY_CONTRIBUTIONS_MAX: 50,
    VERIFICATION_BASIC: 50,
    VERIFICATION_FULL: 100,
    VERIFICATION_BUSINESS: 150,
    ENDORSEMENT_MAX: 100,
    SUCCESSFUL_INVITE: 10,
    FAILED_INVITE: -50,
  },
};
