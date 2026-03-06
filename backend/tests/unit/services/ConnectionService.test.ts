/**
 * Connection Service Unit Tests
 */

import * as ConnectionService from '../../../src/services/ConnectionService';
import { mockUser, mockConnection, mockUserModel, mockConnectionModel } from '../../mocks/models';

// Mock models
jest.mock('../../../src/models/User', () => mockUserModel);
jest.mock('../../../src/models/Connection', () => mockConnectionModel);

describe('ConnectionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendRequest', () => {
    it('should create connection request', async () => {
      mockUserModel.findById.mockResolvedValue(mockUser);
      mockConnectionModel.create.mockResolvedValue(mockConnection);

      const result = await ConnectionService.sendRequest('user-123', 'user-456');

      expect(mockConnectionModel.create).toHaveBeenCalledWith('user-123', 'user-456');
      expect(result).toEqual(mockConnection);
    });

    it('should throw error for self-connection', async () => {
      await expect(ConnectionService.sendRequest('user-123', 'user-123')).rejects.toThrow(
        new ConnectionService.ConnectionError('SELF_CONNECTION', 'Cannot connect to yourself', 400)
      );
    });

    it('should throw error if requester not found', async () => {
      mockUserModel.findById.mockResolvedValueOnce(null).mockResolvedValueOnce(mockUser);

      await expect(ConnectionService.sendRequest('user-123', 'user-456')).rejects.toThrow(
        new ConnectionService.ConnectionError('REQUESTER_NOT_FOUND', 'Requester not found', 404)
      );
    });

    it('should throw error if recipient not found', async () => {
      mockUserModel.findById.mockResolvedValueOnce(mockUser).mockResolvedValueOnce(null);

      await expect(ConnectionService.sendRequest('user-123', 'user-456')).rejects.toThrow(
        new ConnectionService.ConnectionError('RECIPIENT_NOT_FOUND', 'Recipient not found', 404)
      );
    });

    it('should propagate model errors', async () => {
      mockUserModel.findById.mockResolvedValue(mockUser);
      mockConnectionModel.create.mockRejectedValue(new Error('Connection already exists'));

      await expect(ConnectionService.sendRequest('user-123', 'user-456')).rejects.toThrow('Connection already exists');
    });
  });

  describe('acceptRequest', () => {
    const acceptedConnection = { ...mockConnection, status: 'accepted', acceptedAt: new Date() };

    it('should accept connection request', async () => {
      mockConnectionModel.accept.mockResolvedValue(acceptedConnection);
      mockConnectionModel.updateConnectionCounts.mockResolvedValue(undefined);

      const result = await ConnectionService.acceptRequest('conn-123', 'user-456');

      expect(mockConnectionModel.accept).toHaveBeenCalledWith('conn-123', 'user-456');
      expect(mockConnectionModel.updateConnectionCounts).toHaveBeenCalledWith('user-123');
      expect(mockConnectionModel.updateConnectionCounts).toHaveBeenCalledWith('user-456');
      expect(result).toEqual(acceptedConnection);
    });

    it('should update connection counts after acceptance', async () => {
      mockConnectionModel.accept.mockResolvedValue(acceptedConnection);
      mockConnectionModel.updateConnectionCounts.mockResolvedValue(undefined);

      await ConnectionService.acceptRequest('conn-123', 'user-456');

      expect(mockConnectionModel.updateConnectionCounts).toHaveBeenCalledTimes(2);
    });
  });

  describe('rejectRequest', () => {
    const rejectedConnection = { ...mockConnection, status: 'rejected' };

    it('should reject connection request', async () => {
      mockConnectionModel.reject.mockResolvedValue(rejectedConnection);

      const result = await ConnectionService.rejectRequest('conn-123', 'user-456');

      expect(mockConnectionModel.reject).toHaveBeenCalledWith('conn-123', 'user-456');
      expect(result).toEqual(rejectedConnection);
    });
  });

  describe('getUserConnections', () => {
    const mockConnections = [
      { id: 'conn-1', name: 'User One', trustScore: 800, verified: true },
      { id: 'conn-2', name: 'User Two', trustScore: 700, verified: false },
    ];

    it('should return user connections', async () => {
      mockConnectionModel.getByUser.mockResolvedValue(mockConnections);

      const result = await ConnectionService.getUserConnections('user-123');

      expect(result.success).toBe(true);
      expect(result.connections).toHaveLength(2);
    });

    it('should format connections correctly', async () => {
      mockConnectionModel.getByUser.mockResolvedValue(mockConnections);

      const result = await ConnectionService.getUserConnections('user-123');

      expect(result.connections[0]).toHaveProperty('id');
      expect(result.connections[0]).toHaveProperty('name');
      expect(result.connections[0]).toHaveProperty('trustScore');
      expect(result.connections[0]).toHaveProperty('verified');
    });
  });

  describe('getPendingRequests', () => {
    const mockPending = [
      { connectionId: 'conn-1', requester: { id: 'user-1', name: 'User One' } },
      { connectionId: 'conn-2', requester: { id: 'user-2', name: 'User Two' } },
    ];

    it('should return pending requests', async () => {
      mockConnectionModel.getPendingRequests.mockResolvedValue(mockPending);

      const result = await ConnectionService.getPendingRequests('user-123');

      expect(result.success).toBe(true);
      expect(result.pending).toHaveLength(2);
    });

    it('should format pending requests correctly', async () => {
      mockConnectionModel.getPendingRequests.mockResolvedValue(mockPending);

      const result = await ConnectionService.getPendingRequests('user-123');

      expect(result.pending[0]).toHaveProperty('connectionId');
      expect(result.pending[0]).toHaveProperty('requester');
    });
  });

  describe('removeConnection', () => {
    it('should remove connection and update counts', async () => {
      mockConnectionModel.getById.mockResolvedValue(mockConnection);
      mockConnectionModel.reject.mockResolvedValue({ ...mockConnection, status: 'removed' });
      mockConnectionModel.updateConnectionCounts.mockResolvedValue(undefined);

      await ConnectionService.removeConnection('conn-123', 'user-123');

      expect(mockConnectionModel.getById).toHaveBeenCalledWith('conn-123');
      expect(mockConnectionModel.reject).toHaveBeenCalled();
      expect(mockConnectionModel.updateConnectionCounts).toHaveBeenCalledTimes(2);
    });

    it('should throw error if connection not found', async () => {
      mockConnectionModel.getById.mockResolvedValue(null);

      await expect(ConnectionService.removeConnection('nonexistent', 'user-123')).rejects.toThrow(
        new ConnectionService.ConnectionError('NOT_FOUND', 'Connection not found', 404)
      );
    });

    it('should throw error if user not part of connection', async () => {
      mockConnectionModel.getById.mockResolvedValue(mockConnection);

      await expect(ConnectionService.removeConnection('conn-123', 'user-999')).rejects.toThrow(
        new ConnectionService.ConnectionError('FORBIDDEN', 'Not authorized to remove this connection', 403)
      );
    });
  });

  describe('getMutualConnectionsCount', () => {
    it('should return mutual connections count', async () => {
      mockConnectionModel.getMutualCount.mockResolvedValue(5);

      const result = await ConnectionService.getMutualConnectionsCount('user-1', 'user-2');

      expect(result).toBe(5);
      expect(mockConnectionModel.getMutualCount).toHaveBeenCalledWith('user-1', 'user-2');
    });
  });

  describe('ConnectionError', () => {
    it('should create error with code and status', () => {
      const error = new ConnectionService.ConnectionError('TEST_CODE', 'Test message', 500);
      
      expect(error.code).toBe('TEST_CODE');
      expect(error.message).toBe('Test message');
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe('ConnectionError');
    });

    it('should default status to 400', () => {
      const error = new ConnectionService.ConnectionError('TEST', 'Test');
      expect(error.statusCode).toBe(400);
    });
  });
});
