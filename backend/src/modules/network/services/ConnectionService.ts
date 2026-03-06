/**
 * Connection Service
 * Manages user connections and network graph
 */

import * as ConnectionRepository from '../repositories/ConnectionRepository';
import { eventBus, DomainEvents } from '../../shared/events/EventBus';

/**
 * Send connection request
 */
export const sendRequest = async (requesterId: string, recipientId: string): Promise<any> => {
  // Validate not self
  if (requesterId === recipientId) {
    throw new ConnectionError('SELF_CONNECTION', 'Cannot connect to yourself', 400);
  }

  // Check if connection already exists
  const existing = await ConnectionRepository.findExisting(requesterId, recipientId);
  if (existing) {
    throw new ConnectionError('ALREADY_EXISTS', 'Connection already exists', 409);
  }

  // Create connection request
  const connection = await ConnectionRepository.create({
    requesterId,
    recipientId,
    status: 'pending',
  });

  // Publish event
  await eventBus.publish(DomainEvents.CONNECTION_REQUEST_SENT, {
    connectionId: connection.id,
    requesterId,
    recipientId,
    timestamp: new Date(),
  });

  return connection;
};

/**
 * Accept connection request
 */
export const acceptRequest = async (connectionId: string, recipientId: string): Promise<any> => {
  const connection = await ConnectionRepository.findById(connectionId);

  if (!connection) {
    throw new ConnectionError('NOT_FOUND', 'Connection not found', 404);
  }

  if (connection.recipientId !== recipientId) {
    throw new ConnectionError('FORBIDDEN', 'Not authorized to accept this connection', 403);
  }

  if (connection.status !== 'pending') {
    throw new ConnectionError('INVALID_STATUS', 'Connection is not pending', 400);
  }

  const updated = await ConnectionRepository.updateStatus(connectionId, 'accepted');

  // Publish event
  await eventBus.publish(DomainEvents.CONNECTION_REQUEST_ACCEPTED, {
    connectionId,
    requesterId: connection.requesterId,
    recipientId,
    timestamp: new Date(),
  });

  return updated;
};

/**
 * Reject connection request
 */
export const rejectRequest = async (connectionId: string, recipientId: string): Promise<any> => {
  const connection = await ConnectionRepository.findById(connectionId);

  if (!connection) {
    throw new ConnectionError('NOT_FOUND', 'Connection not found', 404);
  }

  if (connection.recipientId !== recipientId) {
    throw new ConnectionError('FORBIDDEN', 'Not authorized to reject this connection', 403);
  }

  const updated = await ConnectionRepository.updateStatus(connectionId, 'declined');
  return updated;
};

/**
 * Get user connections
 */
export const getUserConnections = async (userId: string): Promise<any> => {
  const connections = await ConnectionRepository.findByUserId(userId);

  return {
    success: true,
    connections: connections.map((c: any) => ({
      id: c.id,
      user: c.otherUser,
      connectedAt: c.connectedAt,
    })),
  };
};

/**
 * Get pending requests for user
 */
export const getPendingRequests = async (userId: string): Promise<any> => {
  const pending = await ConnectionRepository.findPendingForUser(userId);

  return {
    success: true,
    pending: pending.map((p: any) => ({
      connectionId: p.id,
      requester: p.requester,
      requestedAt: p.createdAt,
    })),
  };
};

/**
 * Remove connection
 */
export const removeConnection = async (connectionId: string, userId: string): Promise<void> => {
  const connection = await ConnectionRepository.findById(connectionId);

  if (!connection) {
    throw new ConnectionError('NOT_FOUND', 'Connection not found', 404);
  }

  if (connection.requesterId !== userId && connection.recipientId !== userId) {
    throw new ConnectionError('FORBIDDEN', 'Not authorized to remove this connection', 403);
  }

  await ConnectionRepository.remove(connectionId);

  // Publish event
  await eventBus.publish(DomainEvents.CONNECTION_REMOVED, {
    connectionId,
    userId,
    otherUserId: connection.requesterId === userId ? connection.recipientId : connection.requesterId,
    timestamp: new Date(),
  });
};

/**
 * Get mutual connections count
 */
export const getMutualConnectionsCount = async (userId1: string, userId2: string): Promise<number> => {
  return ConnectionRepository.countMutual(userId1, userId2);
};

// ============================================================================
// ERROR
// ============================================================================

export class ConnectionError extends Error {
  public code: string;
  public statusCode: number;

  constructor(code: string, message: string, statusCode: number = 400) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.name = 'ConnectionError';
  }
}
