/**
 * Connection Service
 * Business logic for network connections
 */

import { ConnectionRepository } from './connectionRepository';
import { ConnectionError, Connection } from './connectionTypes';
import { eventBus, DomainEvents } from '../shared/events/eventBus';

/**
 * Get all connections for a user
 */
export const getUserConnections = async (userId: string): Promise<any[]> => {
  const connections = await ConnectionRepository.findActiveByUserId(userId);
  
  return connections.map((conn: any) => ({
    id: conn.id,
    user: conn.connectedUser,
    connectedAt: conn.createdAt,
  }));
};

/**
 * Get pending connection requests for user
 */
export const getPendingRequests = async (userId: string): Promise<any[]> => {
  const pending = await ConnectionRepository.findPendingForUser(userId);
  
  return pending.map((req: any) => ({
    connectionId: req.id,
    requester: req.requester,
    requestedAt: req.createdAt,
  }));
};

/**
 * Send connection request
 */
export const sendRequest = async (requesterId: string, recipientId: string): Promise<Connection> => {
  // Business rule: Cannot connect to yourself
  if (requesterId === recipientId) {
    throw new ConnectionError('SELF_CONNECTION', 'Cannot connect to yourself', 400);
  }
  
  // Business rule: Check if users exist
  const recipientExists = await ConnectionRepository.userExists(recipientId);
  if (!recipientExists) {
    throw new ConnectionError('USER_NOT_FOUND', 'Recipient not found', 404);
  }
  
  // Business rule: Check for existing connection
  const existing = await ConnectionRepository.findBetweenUsers(requesterId, recipientId);
  if (existing) {
    if (existing.status === 'accepted') {
      throw new ConnectionError('ALREADY_CONNECTED', 'Users are already connected', 409);
    }
    if (existing.status === 'pending') {
      throw new ConnectionError('REQUEST_PENDING', 'Connection request already pending', 409);
    }
  }
  
  // Create connection
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
export const acceptRequest = async (connectionId: string, recipientId: string): Promise<Connection> => {
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
export const rejectRequest = async (connectionId: string, recipientId: string): Promise<Connection> => {
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
  
  await ConnectionRepository.deleteById(connectionId);
  
  // Publish event
  await eventBus.publish('connection.removed', {
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
  return ConnectionRepository.countMutualConnections(userId1, userId2);
};
