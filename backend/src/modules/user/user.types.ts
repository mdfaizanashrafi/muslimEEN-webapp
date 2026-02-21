/**
 * User Module Types
 * TypeScript interfaces for user module
 */

import { Request, Response, NextFunction } from 'express';

/**
 * User Role
 */
export type UserRole = 'admin' | 'witness' | 'muslim_verified' | 'muslim_unverified' | 'non_muslim';

/**
 * Verification Tier
 */
export type VerificationTier = 'basic' | 'full' | 'business';

/**
 * Connection Status
 */
export type ConnectionStatus = 'pending' | 'accepted' | 'rejected';

/**
 * Notification Type
 */
export type NotificationType =
  | 'connection_request'
  | 'connection_accepted'
  | 'endorsement_received'
  | 'trust_score_changed'
  | 'verification_completed'
  | 'message_received'
  | 'marketplace_interest'
  | 'dispute_resolution';

/**
 * Work History Entry
 */
export interface WorkHistory {
  id: string;
  company: string;
  title: string;
  startDate: Date;
  endDate?: Date;
  current: boolean;
  description?: string;
}

/**
 * Education Entry
 */
export interface Education {
  id: string;
  institution: string;
  degree: string;
  startDate: Date;
  endDate?: Date;
}

/**
 * User
 */
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: UserRole;
  verificationTier: VerificationTier;
  trustScore: number;
  bio?: string;
  location?: string;
  industry?: string;
  skills: string[];
  endorsements: number;
  connections: number;
  profileViews: number;
  isWitnessEligible: boolean;
  badges: string[];
  createdAt: Date;
  lastLogin?: Date;
  passwordHash?: string;
}

/**
 * User Profile with full details
 */
export interface UserProfile extends User {
  workHistory: WorkHistory[];
  education: Education[];
}

/**
 * Trust Score Factor
 */
export interface TrustScoreFactor {
  name: string;
  impact: number;
  positive: boolean;
}

/**
 * Trust Score Result
 */
export interface TrustScoreResult {
  score: number;
  factors: TrustScoreFactor[];
}

/**
 * Trust Score History Entry
 */
export interface TrustScoreHistoryEntry {
  date: Date;
  score: number;
  factors: Record<string, number>;
}

/**
 * Connection
 */
export interface Connection {
  id: string;
  requesterId: string;
  recipientId: string;
  status: ConnectionStatus;
  createdAt: Date;
  acceptedAt?: Date;
}

/**
 * Connection with user details
 */
export interface ConnectionWithUser {
  id: string;
  name: string;
  trustScore: number;
  verified: boolean;
  connectionId: string;
  connectedAt: Date;
}

/**
 * Pending Connection Request
 */
export interface PendingConnectionRequest {
  connectionId: string;
  requester: {
    id: string;
    name: string;
    trustScore: number;
    verified: boolean;
  };
  requestedAt: Date;
}

/**
 * Actor in notification
 */
export interface NotificationActor {
  id: string;
  name: string;
  trustScore: number;
}

/**
 * Notification
 */
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  actor: NotificationActor | null;
  actionUrl?: string;
  data?: Record<string, any>;
}

/**
 * Notifications List Response
 */
export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

/**
 * Notification Query Options
 */
export interface NotificationQueryOptions {
  unreadOnly?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Update Profile Request Body
 */
export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  bio?: string;
  location?: string;
  industry?: string;
  skills?: string[];
}

/**
 * Connection Request Body
 */
export interface ConnectionRequestBody {
  recipientId: string;
}

/**
 * Authenticated Request with User
 */
export interface AuthenticatedUserRequest extends Request {
  user: User;
}

/**
 * API Error Response
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: string[];
  };
}

/**
 * API Success Response
 */
export interface ApiSuccessResponse<T = any> {
  success: true;
  message?: string;
  data?: T;
}

/**
 * Profile Response
 */
export interface ProfileResponse extends ApiSuccessResponse {
  user: UserProfile;
}

/**
 * Trust Score Response
 */
export interface TrustScoreResponse extends ApiSuccessResponse {
  score: number;
  factors: TrustScoreFactor[];
}

/**
 * Trust Score History Response
 */
export interface TrustScoreHistoryResponse extends ApiSuccessResponse {
  history: TrustScoreHistoryEntry[];
}

/**
 * Connections Response
 */
export interface ConnectionsResponse extends ApiSuccessResponse {
  connections: ConnectionWithUser[];
}

/**
 * Pending Connections Response
 */
export interface PendingConnectionsResponse extends ApiSuccessResponse {
  requests: PendingConnectionRequest[];
}

/**
 * Connection Request Response
 */
export interface ConnectionRequestResponse extends ApiSuccessResponse {
  connection: Connection;
}

/**
 * Connection Action Response
 */
export interface ConnectionActionResponse extends ApiSuccessResponse {
  connection?: Connection;
}

/**
 * Notification Response
 */
export interface NotificationResponse extends ApiSuccessResponse {
  notification?: Notification;
}

/**
 * Controller Function Types
 */
export type UserControllerFunction = (
  req: AuthenticatedUserRequest,
  res: Response,
  next: NextFunction
) => Promise<void | Response>;
