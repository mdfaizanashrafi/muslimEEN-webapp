/**
 * Connection Service
 * Orchestrates connection/network business logic
 * Manages connection requests, approvals, and user connection counts
 */

import Connection from '../models/Connection';
import User from '../models/User';
import { ConnectionsResponse, PendingConnectionsResponse } from '../types/api';

// ============================================================================
// CONNECTION REQUESTS
// ============================================================================

/**
 * Send connection request from one user to another
 * @param requesterId User sending the request
 * @param recipientId User receiving the request
 * @returns Created connection
 * @throws Error if connection already exists
 */
export const sendRequest = async (requesterId: string, recipientId: string) => {
  // Validate users aren't the same
  if (requesterId === recipientId) {
    throw new ConnectionError('SELF_CONNECTION', 'Cannot connect to yourself', 400);
  }

  // Check if both users exist
  const [requester, recipient] = await Promise.all([
    User.findById(requesterId),
    User.findById(recipientId),
  ]);

  if (!requester) {
    throw new ConnectionError('REQUESTER_NOT_FOUND', 'Requester not found', 404);
  }
  if (!recipient) {
    throw new ConnectionError('RECIPIENT_NOT_FOUND', 'Recipient not found', 404);
  }

  // Create connection (model handles duplicate check)
  const connection = await Connection.create(requesterId, recipientId);

  return connection;
};

/**
 * Accept a pending connection request
 * @param connectionId Connection ID
 * @param recipientId User accepting (must be recipient)
 * @returns Updated connection
 */
export const acceptRequest = async (connectionId: string, recipientId: string) => {
  // Accept the connection
  const connection = await Connection.accept(connectionId, recipientId);

  // Update connection counts for both users
  // This is a side effect that belongs in the service layer
  await Promise.all([
    recalculateUserConnectionCount(connection.requesterId),
    recalculateUserConnectionCount(connection.recipientId),
  ]);

  return connection;
};

/**
 * Reject a pending connection request
 * @param connectionId Connection ID
 * @param recipientId User rejecting (must be recipient)
 * @returns Updated connection
 */
export const rejectRequest = async (connectionId: string, recipientId: string) => {
  const connection = await Connection.reject(connectionId, recipientId);
  return connection;
};

// ============================================================================
// CONNECTION MANAGEMENT
// ============================================================================

/**
 * Get all connections for a user
 * @param userId User ID
 * @returns List of connections
 */
export const getUserConnections = async (userId: string): Promise<ConnectionsResponse> => {
  const connections = await Connection.getByUser(userId);
  
  return {
    success: true,
    connections: connections.map((connection: any) => ({
      id: connection.id,
      name: connection.name,
      trustScore: connection.trustScore,
      verified: connection.verified,
      mutualConnections: connection.mutualConnections || 0,
      badges: connection.badges || [],
      connectedAt: connection.connectedAt,
    })),
  };
};

/**
 * Get pending connection requests for a user
 * @param userId User ID
 * @returns List of pending requests
 */
export const getPendingRequests = async (userId: string): Promise<PendingConnectionsResponse> => {
  const pending = await Connection.getPendingRequests(userId);

  return {
    success: true,
    pending: pending.map((pendingRequest: any) => ({
      connectionId: pendingRequest.connectionId,
      requester: pendingRequest.requester,
      requestedAt: pendingRequest.requestedAt,
    })),
  };
};

/**
 * Remove an existing connection
 * @param connectionId Connection ID
 * @param userId User requesting removal (must be part of connection)
 */
export const removeConnection = async (connectionId: string, userId: string) => {
  // Get connection first to check ownership
  const connection = await Connection.getById(connectionId);
  
  if (!connection) {
    throw new ConnectionError('NOT_FOUND', 'Connection not found', 404);
  }

  // Verify user is part of this connection
  if (connection.requesterId !== userId && connection.recipientId !== userId) {
    throw new ConnectionError('FORBIDDEN', 'Not authorized to remove this connection', 403);
  }

  // Delete connection - use reject with a special status or update status to 'removed'
  // Since Connection model doesn't have delete, we update status
  await Connection.reject(connectionId, userId);

  // Update connection counts for both users
  await Promise.all([
    recalculateUserConnectionCount(connection.requesterId),
    recalculateUserConnectionCount(connection.recipientId),
  ]);
};

// ============================================================================
// MUTUAL CONNECTIONS
// ============================================================================

/**
 * Get mutual connections count between two users
 * @param userId1 First user
 * @param userId2 Second user
 * @returns Count of mutual connections
 */
export const getMutualConnectionsCount = async (
  userId1: string, 
  userId2: string
): Promise<number> => {
  return Connection.getMutualCount(userId1, userId2);
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Update connection count for a user
 * Updates the denormalized connections field in users table
 * @param userId User ID
 */
const recalculateUserConnectionCount = async (userId: string): Promise<void> => {
  try {
    await Connection.updateConnectionCounts(userId);
  } catch (countUpdateError) {
    // Log but don't throw - this is a denormalized field
    console.error(`Failed to update connection count for user ${userId}:`, countUpdateError);
  }
};

// ============================================================================
// CUSTOM ERROR
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
