/**
 * Connection Module Types
 */

export type ConnectionStatus = 'pending' | 'accepted' | 'declined';

export interface Connection {
  id: string;
  requesterId: string;
  recipientId: string;
  status: ConnectionStatus;
  createdAt: Date;
  updatedAt?: Date;
}

export interface ConnectionInput {
  requesterId: string;
  recipientId: string;
  status: ConnectionStatus;
}

export class ConnectionError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'ConnectionError';
  }
}
