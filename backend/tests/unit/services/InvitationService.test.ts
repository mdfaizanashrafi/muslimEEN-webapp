/**
 * Invitation Service Unit Tests
 */

import * as InvitationService from '../../../src/services/InvitationService';
import * as TrustScoreService from '../../../src/services/TrustScoreService';
import { mockInvitation, mockInvitationModel } from '../../mocks/models';

// Mock dependencies
jest.mock('../../../src/models/Invitation', () => mockInvitationModel);
jest.mock('../../../src/services/TrustScoreService');

describe('InvitationService', () => {
  const MockedTrustScoreService = TrustScoreService as jest.Mocked<typeof TrustScoreService>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createInvitation', () => {
    const validInvitation = {
      inviterId: 'user-123',
      inviteeEmail: 'invited@example.com',
    };

    beforeEach(() => {
      mockInvitationModel.countPendingByInviter.mockResolvedValue(2);
      mockInvitationModel.create.mockResolvedValue(mockInvitation);
    });

    it('should create invitation with valid data', async () => {
      const result = await InvitationService.createInvitation(validInvitation);

      expect(result).toEqual(mockInvitation);
      expect(mockInvitationModel.create).toHaveBeenCalledWith('user-123', 'invited@example.com');
    });

    it('should normalize email to lowercase', async () => {
      await InvitationService.createInvitation({
        ...validInvitation,
        inviteeEmail: 'INVITED@EXAMPLE.COM',
      });

      expect(mockInvitationModel.create).toHaveBeenCalledWith('user-123', 'invited@example.com');
    });

    it('should trim email whitespace', async () => {
      await InvitationService.createInvitation({
        ...validInvitation,
        inviteeEmail: '  invited@example.com  ',
      });

      expect(mockInvitationModel.create).toHaveBeenCalledWith('user-123', 'invited@example.com');
    });

    it('should throw error for invalid email format', async () => {
      await expect(InvitationService.createInvitation({
        ...validInvitation,
        inviteeEmail: 'invalid-email',
      })).rejects.toThrow(
        new InvitationService.InvitationError('INVALID_EMAIL', 'Invalid email format', 400)
      );
    });

    it('should throw error when invitation limit reached', async () => {
      mockInvitationModel.countPendingByInviter.mockResolvedValue(10);

      await expect(InvitationService.createInvitation(validInvitation)).rejects.toThrow(
        new InvitationService.InvitationError('INVITATION_LIMIT', 'Maximum pending invitations reached', 400)
      );
    });
  });

  describe('getInvitationsByInviter', () => {
    const mockInvitations = [
      mockInvitation,
      { ...mockInvitation, id: 'inv-2', status: 'accepted' },
    ];

    it('should return all invitations', async () => {
      mockInvitationModel.getByInviter.mockResolvedValue(mockInvitations);

      const result = await InvitationService.getInvitationsByInviter('user-123');

      expect(result).toEqual(mockInvitations);
      expect(mockInvitationModel.getByInviter).toHaveBeenCalledWith('user-123', null);
    });

    it('should filter by status', async () => {
      mockInvitationModel.getByInviter.mockResolvedValue([mockInvitation]);

      await InvitationService.getInvitationsByInviter('user-123', 'pending');

      expect(mockInvitationModel.getByInviter).toHaveBeenCalledWith('user-123', 'pending');
    });
  });

  describe('getPendingInvitationCount', () => {
    it('should return count of pending invitations', async () => {
      mockInvitationModel.countPendingByInviter.mockResolvedValue(5);

      const result = await InvitationService.getPendingInvitationCount('user-123');

      expect(result).toBe(5);
      expect(mockInvitationModel.countPendingByInviter).toHaveBeenCalledWith('user-123');
    });
  });

  describe('validateInvitation', () => {
    it('should return validation result', async () => {
      const validationResult = { valid: true, invitation: mockInvitation };
      mockInvitationModel.validate.mockResolvedValue(validationResult);

      const result = await InvitationService.validateInvitation('CODE123');

      expect(result).toEqual(validationResult);
      expect(mockInvitationModel.validate).toHaveBeenCalledWith('CODE123');
    });

    it('should handle invalid invitation', async () => {
      const validationResult = { valid: false, message: 'Invalid code' };
      mockInvitationModel.validate.mockResolvedValue(validationResult);

      const result = await InvitationService.validateInvitation('INVALID');

      expect(result.valid).toBe(false);
    });
  });

  describe('acceptInvitation', () => {
    beforeEach(() => {
      mockInvitationModel.validate.mockResolvedValue({
        valid: true,
        invitation: mockInvitation,
      });
      mockInvitationModel.accept.mockResolvedValue({ ...mockInvitation, status: 'accepted' });
    });

    it('should accept valid invitation', async () => {
      const result = await InvitationService.acceptInvitation('CODE123', 'user-456');

      expect(mockInvitationModel.accept).toHaveBeenCalledWith('CODE123', 'user-456');
      expect(result.status).toBe('accepted');
    });

    it('should throw error for invalid invitation', async () => {
      mockInvitationModel.validate.mockResolvedValue({
        valid: false,
        message: 'Expired code',
      });

      await expect(InvitationService.acceptInvitation('INVALID', 'user-456')).rejects.toThrow(
        new InvitationService.InvitationError('INVALID_INVITATION', 'Expired code', 400)
      );
    });

    it('should throw error if acceptance fails', async () => {
      mockInvitationModel.accept.mockResolvedValue(null);

      await expect(InvitationService.acceptInvitation('CODE123', 'user-456')).rejects.toThrow(
        new InvitationService.InvitationError('ACCEPT_FAILED', 'Failed to accept invitation', 500)
      );
    });
  });

  describe('revokeInvitation', () => {
    it('should revoke pending invitation', async () => {
      mockInvitationModel.revoke.mockResolvedValue({ ...mockInvitation, status: 'revoked' });

      const result = await InvitationService.revokeInvitation('inv-123', 'user-123');

      expect(mockInvitationModel.revoke).toHaveBeenCalledWith('inv-123', 'user-123');
      expect(result.status).toBe('revoked');
    });

    it('should throw error if invitation not found or already processed', async () => {
      mockInvitationModel.revoke.mockResolvedValue(null);

      await expect(InvitationService.revokeInvitation('inv-123', 'user-123')).rejects.toThrow(
        new InvitationService.InvitationError('REVOKE_FAILED', 'Invitation not found or already processed', 404)
      );
    });
  });

  describe('cleanupExpiredInvitations', () => {
    it('should cleanup and return count', async () => {
      mockInvitationModel.cleanupExpired.mockResolvedValue(5);

      const result = await InvitationService.cleanupExpiredInvitations();

      expect(result).toBe(5);
      expect(mockInvitationModel.cleanupExpired).toHaveBeenCalled();
    });
  });

  describe('recordInvitationOutcome', () => {
    beforeEach(() => {
      MockedTrustScoreService.recalculate.mockResolvedValue({
        score: 760,
        previousScore: 750,
        changed: true,
        factors: [],
        witnessEligibilityChanged: false,
        isNowWitnessEligible: true,
      });
    });

    it('should record outcome and recalculate trust score', async () => {
      mockInvitationModel.recordOutcome.mockResolvedValue(undefined);

      await InvitationService.recordInvitationOutcome('inv-123', 'user-123', 'success', 10);

      expect(mockInvitationModel.recordOutcome).toHaveBeenCalledWith('inv-123', 'user-123', 'success', 10);
      expect(MockedTrustScoreService.recalculate).toHaveBeenCalledWith('user-123');
    });

    it('should handle expired outcome', async () => {
      mockInvitationModel.recordOutcome.mockResolvedValue(undefined);

      await InvitationService.recordInvitationOutcome('inv-123', 'user-123', 'expired', 0);

      expect(mockInvitationModel.recordOutcome).toHaveBeenCalledWith('inv-123', 'user-123', 'expired', 0);
    });

    it('should handle banned outcome', async () => {
      mockInvitationModel.recordOutcome.mockResolvedValue(undefined);

      await InvitationService.recordInvitationOutcome('inv-123', 'user-123', 'banned', -50);

      expect(mockInvitationModel.recordOutcome).toHaveBeenCalledWith('inv-123', 'user-123', 'banned', -50);
    });
  });

  describe('InvitationError', () => {
    it('should create error with code and status', () => {
      const error = new InvitationService.InvitationError('TEST_CODE', 'Test message', 500);
      
      expect(error.code).toBe('TEST_CODE');
      expect(error.message).toBe('Test message');
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe('InvitationError');
    });

    it('should default status to 400', () => {
      const error = new InvitationService.InvitationError('TEST', 'Test');
      expect(error.statusCode).toBe(400);
    });
  });
});
