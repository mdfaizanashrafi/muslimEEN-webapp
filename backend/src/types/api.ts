/**
 * API Response Types
 * Standardized response formats for all API endpoints
 */

import { User } from './index';

// ============================================================================
// BASE RESPONSE TYPES
// ============================================================================

export interface ApiError {
  code: string;
  message: string;
  details?: string[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: ApiError;
}

// ============================================================================
// AUTH RESPONSES
// ============================================================================

export interface AuthTokens {
  token: string;
  csrfToken: string;
  expiresAt: Date;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  token: string;
  csrfToken: string;
  user: User;
}

export interface RegisterResponse {
  success: boolean;
  message?: string;
  token: string;
  csrfToken: string;
  user: User;
}

export interface LogoutResponse {
  success: boolean;
  message: string;
}

// ============================================================================
// USER RESPONSES
// ============================================================================

export interface ProfileResponse {
  success: boolean;
  user: User;
}

export interface TrustScoreResponse {
  success: boolean;
  score: number;
  maxScore: number;
  tier: 'high' | 'medium' | 'low';
  factors: TrustScoreFactor[];
}

export interface TrustScoreFactor {
  name: string;
  impact: number;
  positive: boolean;
  percentage: number;
}

export interface TrustScoreHistoryResponse {
  success: boolean;
  history: TrustScoreHistoryEntry[];
}

export interface TrustScoreHistoryEntry {
  date: Date;
  score: number;
  factors: Record<string, unknown>;
}

// ============================================================================
// CONNECTION RESPONSES
// ============================================================================

export interface ConnectionsResponse {
  success: boolean;
  connections: ConnectionSummary[];
}

export interface ConnectionSummary {
  id: string;
  name: string;
  title?: string;
  trustScore: number;
  verified: boolean;
  mutualConnections: number;
  badges: string[];
  connectedAt: Date;
}

export interface PendingConnectionsResponse {
  success: boolean;
  pending: PendingConnection[];
}

export interface PendingConnection {
  connectionId: string;
  requester: {
    id: string;
    name: string;
    trustScore: number;
    verified: boolean;
  };
  requestedAt: Date;
}

// ============================================================================
// NOTIFICATION RESPONSES
// ============================================================================

export interface NotificationsResponse {
  success: boolean;
  notifications: NotificationItem[];
  unreadCount: number;
  total: number;
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  actor?: {
    id: string;
    name: string;
    trustScore: number;
  };
  actionUrl?: string;
  data?: Record<string, unknown>;
}

// ============================================================================
// INVITATION RESPONSES
// ============================================================================

export interface InvitationValidationResponse {
  valid: boolean;
  message: string;
  invitation?: {
    code: string;
    inviterEmail: string;
    inviterName: string;
    expiresAt: Date;
  };
}

// ============================================================================
// PAGINATION
// ============================================================================

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}
