/**
 * Type declarations for JavaScript models
 * These provide TypeScript types for the JS model files
 */

import { 
  User, 
  UserCreateInput, 
  UserUpdateInput,
  Invitation,
  Connection,
  ConnectionStatus,
  Notification,
  NotificationType,
  MarketplaceListing,
  MarketplaceCategory,
  ListingStatus,
  ZakatCalculation, 
  ZakatResult, 
  Donation, 
  QardHasanLoan,
  TrustScore as TrustScoreType,
  TrustScoreFactor 
} from './index';

// ============================================================================
// USER MODEL
// ============================================================================

export interface UserWithProfile extends User {
  workHistory?: WorkHistoryEntry[];
  education?: EducationEntry[];
}

export interface WorkHistoryEntry {
  id: string;
  company: string;
  title: string;
  startDate: Date;
  endDate?: Date;
  current: boolean;
  description?: string;
}

export interface EducationEntry {
  id: string;
  institution: string;
  degree: string;
  startDate: Date;
  endDate?: Date;
}

export interface TrustScoreHistoryEntry {
  date: Date;
  score: number;
  factors: Record<string, unknown>;
}

export interface UserModelClass {
  create(userData: UserCreateInput): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  update(id: string, updates: UserUpdateInput | Record<string, unknown>): Promise<User | null>;
  verifyPassword(user: User, password: string): Promise<boolean>;
  getFullProfile(id: string): Promise<UserWithProfile | null>;
  updateTrustScore(id: string, newScore: number, factors?: Record<string, unknown>): Promise<User>;
  getTrustScoreHistory(id: string): Promise<TrustScoreHistoryEntry[]>;
  formatUser(row: Record<string, unknown>): User;
}

// ============================================================================
// INVITATION MODEL
// ============================================================================

export interface InvitationValidationResult {
  valid: boolean;
  message: string;
  invitation?: Invitation & { inviteeEmail: string };
}

export interface InvitationModelClass {
  create(inviterId: string, inviteeEmail: string): Promise<Invitation>;
  findByCode(code: string): Promise<Invitation | null>;
  validate(code: string): Promise<InvitationValidationResult>;
  accept(code: string, inviteeId: string): Promise<Invitation | null>;
  getByInviter(inviterId: string, status?: string | null): Promise<Invitation[]>;
  countPendingByInviter(inviterId: string): Promise<number>;
  revoke(id: string, inviterId: string): Promise<Invitation | null>;
}

// ============================================================================
// CONNECTION MODEL
// ============================================================================

export interface ConnectionModelClass {
  create(requesterId: string, recipientId: string): Promise<Connection>;
  accept(connectionId: string, recipientId: string): Promise<Connection>;
  reject(connectionId: string, recipientId: string): Promise<Connection>;
  getByUser(userId: string): Promise<Connection[]>;
  getPendingRequests(userId: string): Promise<Connection[]>;
  formatConnection(row: Record<string, unknown>): Connection;
}

// ============================================================================
// NOTIFICATION MODEL
// ============================================================================

export interface NotificationModelClass {
  TYPES: Record<string, string>;
  create(data: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    actorId?: string;
    actorName?: string;
    actorTrustScore?: number;
    actionUrl?: string;
    data?: Record<string, unknown>;
  }): Promise<Notification>;
  getByUser(userId: string, options?: { unreadOnly?: boolean; limit?: number; offset?: number }): Promise<Notification[]>;
  markAsRead(notificationId: string, userId: string): Promise<Notification>;
  markAllAsRead(userId: string): Promise<{ success: boolean }>;
  createConnectionRequest(recipientId: string, requester: { id: string; fullName: string; trustScore: number }): Promise<Notification>;
}

// ============================================================================
// MARKETPLACE MODEL
// ============================================================================

export interface MarketplaceItemData {
  category: string;
  subcategory?: string;
  providerId: string;
  title: string;
  description: string;
  location?: string;
  rate?: string;
  salary?: string;
  seeking?: number;
  price?: string;
  coverage?: string;
  units?: number;
}

export interface MarketplaceFilters {
  category?: string;
  location?: string;
  trustScoreMin?: number;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface FormattedMarketplaceItem extends MarketplaceListing {
  providerUserId?: string;
  providerFirstName?: string;
  providerLastName?: string;
  providerTrustScore?: number;
  providerVerificationTier?: string;
  providerBadges?: string[];
}

export interface MarketplaceModelClass {
  create(vertical: string, itemData: MarketplaceItemData): Promise<FormattedMarketplaceItem>;
  getByVertical(vertical: string, filters?: MarketplaceFilters): Promise<FormattedMarketplaceItem[]>;
  getById(id: string): Promise<FormattedMarketplaceItem | null>;
  update(id: string, updates: Partial<MarketplaceItemData>): Promise<FormattedMarketplaceItem>;
  delete(id: string): Promise<void>;
}

// ============================================================================
// ISLAMIC FINANCE MODELS
// ============================================================================

export interface SadaqahCampaign {
  id: string;
  name: string;
  organization: string;
  description: string;
  goal: number;
  raised: number;
  donors: number;
  daysLeft: number;
  category: string;
  verified: boolean;
}

export interface WaqfData {
  id: string;
  name: string;
  location: string;
  description: string;
  value: number;
  annualIncome: number;
  beneficiaries: string[];
}

export interface QardHasanLoanData {
  id: string;
  borrowerId: string;
  lenderId?: string;
  amount: number;
  purpose: string;
  term: number;
  status: 'pending' | 'funded' | 'repaid' | 'defaulted';
  createdAt: Date;
}

export interface SadaqahModelClass {
  create(data: {
    name: string;
    organization: string;
    description: string;
    goal: number;
    startDate?: Date;
    endDate?: Date;
    category: string;
    imageUrl?: string;
    verified?: boolean;
  }): Promise<SadaqahCampaign>;
  getAll(): Promise<SadaqahCampaign[]>;
  getById(id: string): Promise<SadaqahCampaign | null>;
  recordDonation(campaignId: string, donorId: string, amount: number, anonymous?: boolean, message?: string | null): Promise<unknown>;
}

export interface WaqfModelClass {
  create(data: {
    name: string;
    location: string;
    description: string;
    value: number;
    annualIncome: number;
    beneficiaries: string[];
  }): Promise<WaqfData>;
  getAll(): Promise<WaqfData[]>;
}

export interface QardHasanModelClass {
  create(data: {
    borrowerId: string;
    amount: number;
    purpose: string;
    term: number;
  }): Promise<QardHasanLoanData>;
  getAll(): Promise<QardHasanLoanData[]>;
  getById(id: string): Promise<QardHasanLoanData | null>;
  addLender(loanId: string, lenderId: string, amount: number): Promise<QardHasanLoanData | null>;
  recordRepayment(loanId: string, amount: number): Promise<QardHasanLoanData>;
}

export interface IslamicFinanceModels {
  Sadaqah: SadaqahModelClass;
  Waqf: WaqfModelClass;
  QardHasan: QardHasanModelClass;
  calculateZakat(data: ZakatCalculation): ZakatResult;
}

// ============================================================================
// TRUST SCORE MODEL
// ============================================================================

export interface TrustFactors {
  profileCompleteness?: number;
  connectionQuality?: number;
  communityContributions?: number;
  verificationLevel?: number;
  endorsements?: number;
  successfulInvites?: number;
  failedInvites?: number;
}

export interface TrustScoreResult {
  score: number;
  factors: Array<{
    name: string;
    impact: number;
    positive: boolean;
  }>;
}

export interface TrustScoreModelClass {
  MAX_SCORE: number;
  MIN_SCORE: number;
  POINTS: Record<string, number>;
  calculate(factors: TrustFactors): number;
  recalculate(userId: string): Promise<TrustScoreResult>;
  getUserMetrics(userId: string): Promise<{
    connectionQuality: number;
    communityContributions: number;
    successfulInvites: number;
    failedInvites: number;
  }>;
}

// ============================================================================
// MODULE DECLARATIONS
// ============================================================================

declare module '../models/User' {
  const User: UserModelClass;
  export = User;
}

declare module '../models/Invitation' {
  const Invitation: InvitationModelClass;
  export = Invitation;
}

declare module '../models/Connection' {
  const Connection: ConnectionModelClass;
  export = Connection;
}

declare module '../models/Notification' {
  const Notification: NotificationModelClass;
  export = Notification;
}

declare module '../models/Marketplace' {
  const Marketplace: MarketplaceModelClass;
  export = Marketplace;
}

declare module '../models/IslamicFinance' {
  const IslamicFinance: IslamicFinanceModels;
  export = IslamicFinance;
}

declare module '../models/TrustScore' {
  const TrustScore: TrustScoreModelClass;
  export = TrustScore;
}
