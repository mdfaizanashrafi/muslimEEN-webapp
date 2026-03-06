/**
 * Notification Service Unit Tests
 */

import * as NotificationService from '../../../src/services/NotificationService';
import { mockNotification, mockNotificationModel } from '../../mocks/models';

// Mock models
jest.mock('../../../src/models/Notification', () => mockNotificationModel);

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserNotifications', () => {
    const mockNotifications = [
      { ...mockNotification, id: 'notif-1', read: false },
      { ...mockNotification, id: 'notif-2', read: true },
    ];

    beforeEach(() => {
      mockNotificationModel.getByUser.mockResolvedValue(mockNotifications);
      mockNotificationModel.getUnreadCount.mockResolvedValue(1);
    });

    it('should return notifications with default options', async () => {
      const result = await NotificationService.getUserNotifications('user-123');

      expect(result.success).toBe(true);
      expect(result.notifications).toHaveLength(2);
      expect(result.unreadCount).toBe(1);
      expect(mockNotificationModel.getByUser).toHaveBeenCalledWith('user-123', {
        unreadOnly: false,
        limit: 50,
        offset: 0,
      });
    });

    it('should return unread notifications only when specified', async () => {
      await NotificationService.getUserNotifications('user-123', { unreadOnly: true });

      expect(mockNotificationModel.getByUser).toHaveBeenCalledWith('user-123', {
        unreadOnly: true,
        limit: 50,
        offset: 0,
      });
    });

    it('should support pagination', async () => {
      await NotificationService.getUserNotifications('user-123', { limit: 10, offset: 20 });

      expect(mockNotificationModel.getByUser).toHaveBeenCalledWith('user-123', {
        unreadOnly: false,
        limit: 10,
        offset: 20,
      });
    });

    it('should format notifications correctly', async () => {
      const result = await NotificationService.getUserNotifications('user-123');

      expect(result.notifications[0]).toHaveProperty('id');
      expect(result.notifications[0]).toHaveProperty('type');
      expect(result.notifications[0]).toHaveProperty('title');
      expect(result.notifications[0]).toHaveProperty('read');
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      mockNotificationModel.markAsRead.mockResolvedValue(mockNotification);

      await NotificationService.markAsRead('notif-123', 'user-123');

      expect(mockNotificationModel.markAsRead).toHaveBeenCalledWith('notif-123', 'user-123');
    });

    it('should throw error if notification not found', async () => {
      mockNotificationModel.markAsRead.mockResolvedValue(null);

      await expect(NotificationService.markAsRead('nonexistent', 'user-123')).rejects.toThrow(
        new NotificationService.NotificationError('NOT_FOUND', 'Notification not found', 404)
      );
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      mockNotificationModel.markAllAsRead.mockResolvedValue({ success: true });

      await NotificationService.markAllAsRead('user-123');

      expect(mockNotificationModel.markAllAsRead).toHaveBeenCalledWith('user-123');
    });
  });

  describe('deleteNotification', () => {
    it('should delete notification', async () => {
      mockNotificationModel.delete.mockResolvedValue({ id: 'notif-123' });

      await NotificationService.deleteNotification('notif-123', 'user-123');

      expect(mockNotificationModel.delete).toHaveBeenCalledWith('notif-123', 'user-123');
    });

    it('should throw error if notification not found', async () => {
      mockNotificationModel.delete.mockResolvedValue(null);

      await expect(NotificationService.deleteNotification('nonexistent', 'user-123')).rejects.toThrow(
        new NotificationService.NotificationError('NOT_FOUND', 'Notification not found', 404)
      );
    });
  });

  describe('Notification Creation Helpers', () => {
    const mockRequester = { id: 'user-456', fullName: 'Requester User', trustScore: 800 };

    describe('notifyConnectionRequest', () => {
      it('should create connection request notification', async () => {
        mockNotificationModel.createConnectionRequest.mockResolvedValue(mockNotification);

        await NotificationService.notifyConnectionRequest('user-123', mockRequester);

        expect(mockNotificationModel.createConnectionRequest).toHaveBeenCalledWith('user-123', mockRequester);
      });
    });

    describe('notifyConnectionAccepted', () => {
      it('should create connection accepted notification', async () => {
        mockNotificationModel.create.mockResolvedValue(mockNotification);

        await NotificationService.notifyConnectionAccepted('user-123', mockRequester);

        expect(mockNotificationModel.create).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: 'user-123',
            type: 'connection_accepted',
            title: 'Connection Accepted',
          })
        );
      });
    });

    describe('notifyEndorsement', () => {
      const mockEndorser = { id: 'user-789', fullName: 'Endorser User', trustScore: 900 };

      it('should create endorsement notification', async () => {
        mockNotificationModel.createEndorsement.mockResolvedValue(mockNotification);

        await NotificationService.notifyEndorsement('user-123', mockEndorser, 'JavaScript');

        expect(mockNotificationModel.createEndorsement).toHaveBeenCalledWith(
          'user-123',
          mockEndorser,
          'JavaScript'
        );
      });
    });

    describe('notifyTrustScoreChange', () => {
      it('should create increase notification', async () => {
        mockNotificationModel.create.mockResolvedValue(mockNotification);

        await NotificationService.notifyTrustScoreChange('user-123', 700, 750);

        expect(mockNotificationModel.create).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: 'user-123',
            type: 'trust_score_changed',
            title: 'Trust Score Increased',
            message: 'Your trust score increased by 50 points',
          })
        );
      });

      it('should create decrease notification', async () => {
        mockNotificationModel.create.mockResolvedValue(mockNotification);

        await NotificationService.notifyTrustScoreChange('user-123', 750, 700);

        expect(mockNotificationModel.create).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Trust Score Decreased',
            message: 'Your trust score decreased by 50 points',
          })
        );
      });
    });

    describe('notifyVerificationCompleted', () => {
      it('should create basic verification notification', async () => {
        mockNotificationModel.createVerificationCompleted.mockResolvedValue(mockNotification);

        await NotificationService.notifyVerificationCompleted('user-123', 'basic');

        expect(mockNotificationModel.createVerificationCompleted).toHaveBeenCalledWith('user-123', 'basic');
      });

      it('should create full verification notification', async () => {
        mockNotificationModel.createVerificationCompleted.mockResolvedValue(mockNotification);

        await NotificationService.notifyVerificationCompleted('user-123', 'full');

        expect(mockNotificationModel.createVerificationCompleted).toHaveBeenCalledWith('user-123', 'full');
      });

      it('should create business verification notification', async () => {
        mockNotificationModel.createVerificationCompleted.mockResolvedValue(mockNotification);

        await NotificationService.notifyVerificationCompleted('user-123', 'business');

        expect(mockNotificationModel.createVerificationCompleted).toHaveBeenCalledWith('user-123', 'business');
      });
    });
  });

  describe('NotificationError', () => {
    it('should create error with code and status', () => {
      const error = new NotificationService.NotificationError('TEST_CODE', 'Test message', 500);
      
      expect(error.code).toBe('TEST_CODE');
      expect(error.message).toBe('Test message');
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe('NotificationError');
    });

    it('should default status to 400', () => {
      const error = new NotificationService.NotificationError('TEST', 'Test');
      expect(error.statusCode).toBe(400);
    });
  });
});
