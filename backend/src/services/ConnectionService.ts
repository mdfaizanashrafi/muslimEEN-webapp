/**
 * Connection Service
 * Orchestrates connection/network business logic
 * Manages connection requests, approvals, and user connection counts
 */

import Connection from '../models/connection';
import User from '../models/user';
import { ConnectionsResponse, PendingConnectionsResponse } from '../types/api';

// ============================================================================
// CONNECTION REQUESTS
// ============================================================================

/**
 * Sends a connection request from one user to another.
 *
 * Initiates the professional networking connection flow. The requester sends
 * a connection request to the recipient, creating a pending connection record.
 * The recipient can later accept or reject the request.
 *
 * Validation checks:
 * - Users cannot connect to themselves
 * - Both requester and recipient must exist in the system
 * - Duplicate connection attempts are handled by the Connection model
 *
 * @param requesterId - Unique identifier of the user sending the request (UUID v4)
 * @param recipientId - Unique identifier of the user receiving the request (UUID v4)
 *
 * @returns Created connection record with pending status
 * @returns {string} result.id - Connection record unique identifier
 * @returns {string} result.requesterId - ID of user who sent the request
 * @returns {string} result.recipientId - ID of user receiving the request
 * @returns {string} result.status - Connection status ('pending', 'accepted', 'rejected')
 * @returns {Date} result.createdAt - Timestamp when request was created
 *
 * @throws {ConnectionError} SELF_CONNECTION - Attempt to connect with oneself
 * @throws {ConnectionError} REQUESTER_NOT_FOUND - Requesting user doesn't exist
 * @throws {ConnectionError} RECIPIENT_NOT_FOUND - Target user doesn't exist
 *
 * @example
 * ```typescript
 * // User A sends connection request to User B
 * const connection = await sendRequest(
 *   '550e8400-e29b-41d4-a716-446655440000', // User A
 *   '660f9511-f30c-52e5-b827-557766551111'  // User B
 * );
 *
 * console.log(connection.status); // "pending"
 * console.log(connection.requesterId); // "550e8400-e29b-41d4-a716-446655440000"
 * console.log(connection.recipientId); // "660f9511-f30c-52e5-b827-557766551111"
 * ```
 *
 * @see {@link acceptRequest} for approving connection requests
 * @see {@link rejectRequest} for declining connection requests
 * @see {@link getPendingRequests} for viewing incoming requests
 * @see {@link ConnectionError} for error handling
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
 * Accepts a pending connection request, establishing a mutual connection.
 *
 * When a recipient accepts a connection request, this function:
 * 1. Updates the connection status to 'accepted'
 * 2. Recalculates connection counts for both users
 * 3. May trigger trust score updates for both parties
 *
 * Only the recipient (target user) of the request can accept it.
 *
 * @param connectionId - Unique identifier of the connection record (UUID v4)
 * @param recipientId - Unique identifier of the user accepting the request (must match connection.recipientId)
 *
 * @returns Updated connection record with accepted status
 * @returns {string} result.id - Connection record unique identifier
 * @returns {string} result.status - Connection status ('accepted')
 * @returns {Date} result.acceptedAt - Timestamp when request was accepted
 * @returns {string} result.requesterId - ID of original requester
 * @returns {string} result.recipientId - ID of accepting user
 *
 * @throws {ConnectionError} NOT_FOUND - Connection record doesn't exist
 * @throws {ConnectionError} FORBIDDEN - User is not the recipient of this request
 * @throws {ConnectionError} INVALID_STATUS - Connection is not in pending status
 *
 * @example
 * ```typescript
 * // User B accepts connection request from User A
 * const connection = await acceptRequest(
 *   '770g0622-g41d-63f6-c938-668877662222', // Connection ID
 *   '660f9511-f30c-52e5-b827-557766551111'  // User B (recipient)
 * );
 *
 * console.log(connection.status); // "accepted"
 * console.log(connection.acceptedAt); // 2024-01-15T10:30:00.000Z
 *
 * // Both users' connection counts are now updated
 * ```
 *
 * @see {@link sendRequest} for creating connection requests
 * @see {@link rejectRequest} for declining requests
 * @see {@link getUserConnections} for viewing established connections
 * @see {@link ConnectionError} for error handling
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
