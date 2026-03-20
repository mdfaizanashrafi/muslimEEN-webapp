/**
 * Core Type Definitions
 * MuslimEEN Backend TypeScript Migration
 */

import { Request, Response, NextFunction } from 'express';

// Ensure Express namespace is extended
export {};

// ============================================================================
// USER TYPES
// ============================================================================

export type UserRole = 
  | 'user'
  | 'admin' 
  | 'super_admin'
  | 'muslim_unverified'
  | 'muslim_verified';

export type VerificationTier = 'basic' | 'standard' | 'advanced';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: UserRole;
  verificationTier: VerificationTier;
  trustScore: number;
  invitesRemaining: number;
  bio?: string;
  location?: string;
  industry?: string;
  skills?: string[];
  badges?: string[];
  endorsements?: number;
  connections?: number;
  profileViews?: number;
  isActive?: boolean;
  createdAt: Date;
  lastLogin?: Date;
  // Internal use only
  passwordHash?: string;
  updatedAt?: Date;
}

export interface UserCreateInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
  verificationTier?: VerificationTier;
}

export interface UserUpdateInput {
  firstName?: string;
  lastName?: string;
  bio?: string;
  location?: string;
  industry?: string;
  skills?: string[];
  role?: UserRole;
  verificationTier?: VerificationTier;
  trustScore?: number;
  badges?: string[];
  lastLogin?: Date;
  invitesRemaining?: number;
}

// ============================================================================
// JWT & AUTH TYPES
// ============================================================================

export interface JWTPayload {
  id: string;
  email: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export type AuthMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => void | Promise<void>;

export type AsyncRequestHandler = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => Promise<void | Response>;

// ============================================================================
// API RESPONSE TYPES
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
// MARKETPLACE TYPES
// ============================================================================

export type MarketplaceCategory = 
  | 'work'
  | 'earn' 
  | 'build'
  | 'protect';

export type ListingStatus = 'active' | 'inactive' | 'pending' | 'closed';

export interface MarketplaceListing {
  id: string;
  userId: string;
  category: MarketplaceCategory;
  subcategory?: string;
  title: string;
  description: string;
  location?: string;
  rate?: string;
  salary?: string;
  seeking?: number;
  price?: string;
  coverage?: string;
  units?: number;
  status: ListingStatus;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// INVITE TYPES
// ============================================================================

export type InviteStatus = 'pending' | 'used' | 'expired' | 'revoked';

export interface Invite {
  id: string;
  token: string;
  createdBy: string;
  inviteeEmail?: string;
  usedBy?: string;
  status: InviteStatus;
  expiresAt: Date;
  createdAt: Date;
  usedAt?: Date;
}

export interface InviteWithInviter extends Invite {
  inviterName: string;
  inviterEmail?: string;
}

// ============================================================================
// CONNECTION TYPES
// ============================================================================

export type ConnectionStatus = 'pending' | 'accepted' | 'declined' | 'blocked';

export interface Connection {
  id: string;
  requesterId: string;
  recipientId: string;
  status: ConnectionStatus;
  message?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

export type NotificationType = 
  | 'connection_request'
  | 'connection_accepted'
  | 'message_received'
  | 'verification_update'
  | 'trust_score_update'
  | 'marketplace_update'
  | 'invite_created'
  | 'invite_used';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: Date;
}

// ============================================================================
// ISLAMIC FINANCE TYPES
// ============================================================================

export interface ZakatCalculation {
  cash: number;
  gold: number;
  silver: number;
  investments: number;
  businessAssets: number;
  debts: number;
  nisabType: 'gold' | 'silver';
}

export interface ZakatResult {
  totalAssets: number;
  totalDebts: number;
  netAssets: number;
  nisabThreshold: number;
  nisabType: 'gold' | 'silver';
  isZakatDue: boolean;
  zakatAmount: number;
  zakatRate: number;
}

export interface Donation {
  id: string;
  userId: string;
  amount: number;
  anonymous: boolean;
  message?: string;
  createdAt: Date;
}

export interface QardHasanLoan {
  id: string;
  borrowerId: string;
  lenderId?: string;
  amount: number;
  purpose: string;
  term: number; // months
  status: 'pending' | 'funded' | 'repaid' | 'defaulted';
  createdAt: Date;
}

// ============================================================================
// VERIFICATION TYPES
// ============================================================================

export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';
export type VerificationType = 'identity' | 'business' | 'institution';

export interface VerificationRequest {
  id: string;
  userId: string;
  type: VerificationType;
  status: VerificationStatus;
  documents: string[];
  reviewedBy?: string;
  reviewedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// TRUST SCORE TYPES
// ============================================================================

export interface TrustScore {
  id: string;
  userId: string;
  score: number;
  factors: TrustScoreFactor[];
  calculatedAt: Date;
}

export interface TrustScoreFactor {
  name: string;
  weight: number;
  score: number;
}

// ============================================================================
// EXPRESS EXTENSIONS
// ============================================================================

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface DatabaseQueryResult<T> {
  rows: T[];
  rowCount: number;
}
