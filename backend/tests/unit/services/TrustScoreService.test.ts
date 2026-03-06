/**
 * Trust Score Service Unit Tests
 */

import * as TrustScoreService from '../../../src/services/TrustScoreService';
import { mockUser, mockUserModel, mockTrustScoreModel } from '../../mocks/models';

// Mock models
jest.mock('../../../src/models/User', () => mockUserModel);
jest.mock('../../../src/models/TrustScore', () => mockTrustScoreModel);

describe('TrustScoreService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('recalculate', () => {
    const mockMetrics = {
      connectionQuality: 25,
      communityContributions: 20,
      successfulInvites: 2,
      failedInvites: 0,
    };

    beforeEach(() => {
      mockUserModel.getFullProfile.mockResolvedValue(mockUser);
      mockTrustScoreModel.getUserMetrics.mockResolvedValue(mockMetrics);
      mockTrustScoreModel.calculateProfileCompleteness.mockReturnValue(80);
      mockTrustScoreModel.getVerificationPoints.mockReturnValue(100);
      mockTrustScoreModel.calculate.mockReturnValue(750);
    });

    it('should recalculate trust score successfully', async () => {
      mockUserModel.updateTrustScore.mockResolvedValue(mockUser);

      const result = await TrustScoreService.recalculate('user-123');

      expect(result.score).toBe(750);
      expect(result.previousScore).toBe(mockUser.trustScore);
      expect(result.factors).toBeDefined();
      expect(result.factors.length).toBeGreaterThan(0);
    });

    it('should update trust score if changed', async () => {
      const userWithLowerScore = { ...mockUser, trustScore: 700 };
      mockUserModel.getFullProfile.mockResolvedValue(userWithLowerScore);
      mockTrustScoreModel.calculate.mockReturnValue(750);
      mockUserModel.updateTrustScore.mockResolvedValue(mockUser);

      const result = await TrustScoreService.recalculate('user-123');

      expect(result.changed).toBe(true);
      expect(mockUserModel.updateTrustScore).toHaveBeenCalledWith(
        'user-123',
        750,
        expect.any(Object)
      );
    });

    it('should not update if score unchanged', async () => {
      mockTrustScoreModel.calculate.mockReturnValue(mockUser.trustScore);

      const result = await TrustScoreService.recalculate('user-123');

      expect(result.changed).toBe(false);
      expect(mockUserModel.updateTrustScore).not.toHaveBeenCalled();
    });

    it('should update witness eligibility if threshold crossed', async () => {
      const lowScoreUser = { ...mockUser, trustScore: 150, isWitnessEligible: false };
      mockUserModel.getFullProfile.mockResolvedValue(lowScoreUser);
      mockTrustScoreModel.calculate.mockReturnValue(250); // Crosses 200 threshold
      mockUserModel.updateTrustScore.mockResolvedValue(mockUser);

      const result = await TrustScoreService.recalculate('user-123');

      expect(result.witnessEligibilityChanged).toBe(true);
      expect(result.isNowWitnessEligible).toBe(true);
      expect(mockUserModel.update).toHaveBeenCalledWith('user-123', {
        is_witness_eligible: true,
      });
    });

    it('should throw error if user not found', async () => {
      mockUserModel.getFullProfile.mockResolvedValue(null);

      await expect(TrustScoreService.recalculate('nonexistent')).rejects.toThrow(
        new TrustScoreService.TrustScoreError('USER_NOT_FOUND', 'User not found', 404)
      );
    });

    it('should include all factor breakdowns', async () => {
      mockUserModel.updateTrustScore.mockResolvedValue(mockUser);

      const result = await TrustScoreService.recalculate('user-123');

      const factorNames = result.factors.map(f => f.name);
      expect(factorNames).toContain('Profile Completeness');
      expect(factorNames).toContain('Connection Quality');
      expect(factorNames).toContain('Community Contributions');
      expect(factorNames).toContain('Verification Level');
      expect(factorNames).toContain('Endorsements');
    });
  });

  describe('getCurrentScore', () => {
    it('should return current trust score', async () => {
      mockUserModel.findById.mockResolvedValue(mockUser);

      const result = await TrustScoreService.getCurrentScore('user-123');

      expect(result).toBe(mockUser.trustScore);
    });

    it('should return 0 if trust score is null', async () => {
      const userWithoutScore = { ...mockUser, trustScore: null };
      mockUserModel.findById.mockResolvedValue(userWithoutScore);

      const result = await TrustScoreService.getCurrentScore('user-123');

      expect(result).toBe(0);
    });

    it('should throw error if user not found', async () => {
      mockUserModel.findById.mockResolvedValue(null);

      await expect(TrustScoreService.getCurrentScore('nonexistent')).rejects.toThrow(
        new TrustScoreService.TrustScoreError('USER_NOT_FOUND', 'User not found', 404)
      );
    });
  });

  describe('getHistory', () => {
    const mockHistory = [
      { date: new Date('2024-01-01'), score: 700, factors: { test: true } },
      { date: new Date('2024-02-01'), score: 750, factors: { test: false } },
    ];

    it('should return trust score history', async () => {
      mockUserModel.getTrustScoreHistory.mockResolvedValue(mockHistory);

      const result = await TrustScoreService.getHistory('user-123');

      expect(result.success).toBe(true);
      expect(result.history).toHaveLength(2);
      expect(result.history[0].score).toBe(700);
    });

    it('should format history correctly', async () => {
      mockUserModel.getTrustScoreHistory.mockResolvedValue(mockHistory);

      const result = await TrustScoreService.getHistory('user-123');

      expect(result.history[0]).toHaveProperty('date');
      expect(result.history[0]).toHaveProperty('score');
      expect(result.history[0]).toHaveProperty('factors');
    });
  });

  describe('checkWitnessEligibility', () => {
    it('should return true if eligible', async () => {
      mockUserModel.findById.mockResolvedValue(mockUser);

      const result = await TrustScoreService.checkWitnessEligibility('user-123');

      expect(result).toBe(true);
    });

    it('should return false if not eligible', async () => {
      const notEligibleUser = { ...mockUser, isWitnessEligible: false };
      mockUserModel.findById.mockResolvedValue(notEligibleUser);

      const result = await TrustScoreService.checkWitnessEligibility('user-123');

      expect(result).toBe(false);
    });

    it('should return false if property undefined', async () => {
      const undefinedUser = { ...mockUser, isWitnessEligible: undefined };
      mockUserModel.findById.mockResolvedValue(undefinedUser);

      const result = await TrustScoreService.checkWitnessEligibility('user-123');

      expect(result).toBe(false);
    });

    it('should throw error if user not found', async () => {
      mockUserModel.findById.mockResolvedValue(null);

      await expect(TrustScoreService.checkWitnessEligibility('nonexistent')).rejects.toThrow(
        new TrustScoreService.TrustScoreError('USER_NOT_FOUND', 'User not found', 404)
      );
    });
  });

  describe('formatTrustScoreResponse', () => {
    const mockFactors = [
      { name: 'Test Factor', impact: 50, positive: true, percentage: 100 },
    ];

    it('should format high tier response', () => {
      const result = TrustScoreService.formatTrustScoreResponse(750, mockFactors);

      expect(result.success).toBe(true);
      expect(result.score).toBe(750);
      expect(result.maxScore).toBe(1000);
      expect(result.tier).toBe('high');
      expect(result.factors).toEqual(mockFactors);
    });

    it('should format medium tier response', () => {
      const result = TrustScoreService.formatTrustScoreResponse(500, mockFactors);

      expect(result.tier).toBe('medium');
    });

    it('should format low tier response', () => {
      const result = TrustScoreService.formatTrustScoreResponse(100, mockFactors);

      expect(result.tier).toBe('low');
    });
  });

  describe('TrustScoreError', () => {
    it('should create error with code and status', () => {
      const error = new TrustScoreService.TrustScoreError('TEST_CODE', 'Test message', 500);
      
      expect(error.code).toBe('TEST_CODE');
      expect(error.message).toBe('Test message');
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe('TrustScoreError');
    });

    it('should default status to 400', () => {
      const error = new TrustScoreService.TrustScoreError('TEST', 'Test');
      expect(error.statusCode).toBe(400);
    });
  });
});
