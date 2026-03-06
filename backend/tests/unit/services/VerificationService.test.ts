/**
 * Verification Service Unit Tests
 */

import * as VerificationService from '../../../src/services/VerificationService';
import * as TrustScoreService from '../../../src/services/TrustScoreService';
import * as NotificationService from '../../../src/services/NotificationService';
import { mockUser, mockUserModel } from '../../mocks/models';

// Mock dependencies
jest.mock('../../../src/models/User', () => mockUserModel);
jest.mock('../../../src/services/TrustScoreService');
jest.mock('../../../src/services/NotificationService');

describe('VerificationService', () => {
  const MockedTrustScoreService = TrustScoreService as jest.Mocked<typeof TrustScoreService>;
  const MockedNotificationService = NotificationService as jest.Mocked<typeof NotificationService>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('requestBiometricVerification', () => {
    it('should generate challenge for valid user', async () => {
      mockUserModel.findById.mockResolvedValue(mockUser);

      const result = await VerificationService.requestBiometricVerification('user-123');

      expect(result.challenge).toBeDefined();
      expect(typeof result.challenge).toBe('string');
      expect(result.challenge.length).toBeGreaterThan(0);
    });

    it('should throw error if user not found', async () => {
      mockUserModel.findById.mockResolvedValue(null);

      await expect(VerificationService.requestBiometricVerification('nonexistent')).rejects.toThrow(
        new VerificationService.VerificationError('USER_NOT_FOUND', 'User not found', 404)
      );
    });

    it('should generate unique challenges', async () => {
      mockUserModel.findById.mockResolvedValue(mockUser);

      const result1 = await VerificationService.requestBiometricVerification('user-123');
      const result2 = await VerificationService.requestBiometricVerification('user-123');

      expect(result1.challenge).not.toBe(result2.challenge);
    });
  });

  describe('completeBiometricVerification', () => {
    beforeEach(() => {
      MockedTrustScoreService.recalculate.mockResolvedValue({
        score: 850,
        previousScore: 750,
        changed: true,
        factors: [],
        witnessEligibilityChanged: false,
        isNowWitnessEligible: true,
      });
      MockedNotificationService.notifyVerificationCompleted.mockResolvedValue(undefined);
    });

    it('should update verification tier and recalculate score', async () => {
      mockUserModel.update.mockResolvedValue({ ...mockUser, verificationTier: 'full' });

      const result = await VerificationService.completeBiometricVerification('user-123');

      expect(mockUserModel.update).toHaveBeenCalledWith('user-123', { verificationTier: 'full' });
      expect(MockedTrustScoreService.recalculate).toHaveBeenCalledWith('user-123');
      expect(result.user.verificationTier).toBe('full');
      expect(result.trustScoreChanged).toBe(true);
    });

    it('should send notification', async () => {
      mockUserModel.update.mockResolvedValue({ ...mockUser, verificationTier: 'full' });

      await VerificationService.completeBiometricVerification('user-123');

      expect(MockedNotificationService.notifyVerificationCompleted).toHaveBeenCalledWith('user-123', 'full');
    });

    it('should throw error if update fails', async () => {
      mockUserModel.update.mockResolvedValue(null);

      await expect(VerificationService.completeBiometricVerification('user-123')).rejects.toThrow(
        new VerificationService.VerificationError('UPDATE_FAILED', 'Failed to update user', 500)
      );
    });
  });

  describe('requestWitnessVerification', () => {
    const mockWitnessIds = ['witness-1', 'witness-2'];

    beforeEach(() => {
      mockUserModel.findById.mockResolvedValue(mockUser);
    });

    it('should validate user exists', async () => {
      await VerificationService.requestWitnessVerification('user-123', mockWitnessIds);

      expect(mockUserModel.findById).toHaveBeenCalledWith('user-123');
    });

    it('should validate witnesses are eligible', async () => {
      const eligibleWitness = { ...mockUser, id: 'witness-1', isWitnessEligible: true };
      mockUserModel.findById
        .mockResolvedValueOnce(mockUser) // Requester
        .mockResolvedValueOnce(eligibleWitness)
        .mockResolvedValueOnce(eligibleWitness);

      await VerificationService.requestWitnessVerification('user-123', mockWitnessIds);

      expect(mockUserModel.findById).toHaveBeenCalledTimes(3);
    });

    it('should throw error if witness not eligible', async () => {
      const ineligibleWitness = { ...mockUser, id: 'witness-1', isWitnessEligible: false };
      mockUserModel.findById
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(ineligibleWitness);

      await expect(VerificationService.requestWitnessVerification('user-123', mockWitnessIds)).rejects.toThrow(
        new VerificationService.VerificationError('INELIGIBLE_WITNESSES', 'Some witnesses are not eligible', 400)
      );
    });

    it('should throw error if user not found', async () => {
      mockUserModel.findById.mockResolvedValue(null);

      await expect(VerificationService.requestWitnessVerification('nonexistent', mockWitnessIds)).rejects.toThrow(
        new VerificationService.VerificationError('USER_NOT_FOUND', 'User not found', 404)
      );
    });
  });

  describe('approveWitnessVerification', () => {
    const eligibleWitness = { ...mockUser, id: 'witness-1', isWitnessEligible: true };

    beforeEach(() => {
      mockUserModel.findById.mockResolvedValue(eligibleWitness);
      mockUserModel.update.mockResolvedValue({ ...mockUser, verificationTier: 'full' });
      MockedTrustScoreService.recalculate.mockResolvedValue({
        score: 850,
        previousScore: 750,
        changed: true,
        factors: [],
        witnessEligibilityChanged: false,
        isNowWitnessEligible: true,
      });
      MockedNotificationService.notifyVerificationCompleted.mockResolvedValue(undefined);
    });

    it('should update verification tier', async () => {
      const result = await VerificationService.approveWitnessVerification('user-123', 'witness-1');

      expect(mockUserModel.update).toHaveBeenCalledWith('user-123', { verificationTier: 'full' });
      expect(result.user.verificationTier).toBe('full');
    });

    it('should validate witness eligibility', async () => {
      await VerificationService.approveWitnessVerification('user-123', 'witness-1');

      expect(mockUserModel.findById).toHaveBeenCalledWith('witness-1');
    });

    it('should throw error if witness not eligible', async () => {
      mockUserModel.findById.mockResolvedValue({ ...eligibleWitness, isWitnessEligible: false });

      await expect(VerificationService.approveWitnessVerification('user-123', 'witness-1')).rejects.toThrow(
        new VerificationService.VerificationError('WITNESS_NOT_ELIGIBLE', 'Witness is not eligible', 403)
      );
    });

    it('should recalculate trust score', async () => {
      await VerificationService.approveWitnessVerification('user-123', 'witness-1');

      expect(MockedTrustScoreService.recalculate).toHaveBeenCalledWith('user-123');
    });

    it('should send notification', async () => {
      await VerificationService.approveWitnessVerification('user-123', 'witness-1');

      expect(MockedNotificationService.notifyVerificationCompleted).toHaveBeenCalledWith('user-123', 'full');
    });
  });

  describe('requestBusinessVerification', () => {
    it('should validate user exists', async () => {
      mockUserModel.findById.mockResolvedValue(mockUser);

      await VerificationService.requestBusinessVerification('user-123');

      expect(mockUserModel.findById).toHaveBeenCalledWith('user-123');
    });

    it('should throw error if user not found', async () => {
      mockUserModel.findById.mockResolvedValue(null);

      await expect(VerificationService.requestBusinessVerification('nonexistent')).rejects.toThrow(
        new VerificationService.VerificationError('USER_NOT_FOUND', 'User not found', 404)
      );
    });
  });

  describe('approveBusinessVerification', () => {
    const mockAdmin = { ...mockUser, id: 'admin-1', role: 'admin' };

    beforeEach(() => {
      mockUserModel.findById.mockResolvedValue(mockAdmin);
      mockUserModel.update.mockResolvedValue({ ...mockUser, verificationTier: 'business', role: 'business_provider' });
      MockedTrustScoreService.recalculate.mockResolvedValue({
        score: 900,
        previousScore: 750,
        changed: true,
        factors: [],
        witnessEligibilityChanged: false,
        isNowWitnessEligible: true,
      });
      MockedNotificationService.notifyVerificationCompleted.mockResolvedValue(undefined);
    });

    it('should update user to business tier and role', async () => {
      const result = await VerificationService.approveBusinessVerification('user-123', 'admin-1');

      expect(mockUserModel.update).toHaveBeenCalledWith('user-123', {
        verificationTier: 'business',
        role: 'business_provider',
      });
      expect(result.user.verificationTier).toBe('business');
    });

    it('should validate admin exists', async () => {
      await VerificationService.approveBusinessVerification('user-123', 'admin-1');

      expect(mockUserModel.findById).toHaveBeenCalledWith('admin-1');
    });

    it('should throw error if admin not found', async () => {
      mockUserModel.findById.mockResolvedValue(null);

      await expect(VerificationService.approveBusinessVerification('user-123', 'nonexistent')).rejects.toThrow(
        new VerificationService.VerificationError('ADMIN_NOT_FOUND', 'Admin not found', 404)
      );
    });

    it('should recalculate trust score', async () => {
      await VerificationService.approveBusinessVerification('user-123', 'admin-1');

      expect(MockedTrustScoreService.recalculate).toHaveBeenCalledWith('user-123');
    });
  });

  describe('VerificationError', () => {
    it('should create error with code and status', () => {
      const error = new VerificationService.VerificationError('TEST_CODE', 'Test message', 500);
      
      expect(error.code).toBe('TEST_CODE');
      expect(error.message).toBe('Test message');
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe('VerificationError');
    });

    it('should default status to 400', () => {
      const error = new VerificationService.VerificationError('TEST', 'Test');
      expect(error.statusCode).toBe(400);
    });
  });
});
