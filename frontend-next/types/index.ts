export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: 'muslim_verified' | 'muslim_unverified' | 'non_muslim' | 'business_provider';
  verificationTier: 'basic' | 'full' | 'business';
  trustScore: number;
  trustScoreHistory: Array<{ date: string; score: number }>;
  bio: string;
  location: string;
  industry: string;
  skills: string[];
  endorsements: number;
  connections: number;
  profileViews: number;
  isWitnessEligible: boolean;
  badges: ('biometric' | 'two_witness' | 'business' | 'institutional')[];
  workHistory: WorkHistory[];
  education: Education[];
  createdAt: string;
  lastLogin: string;
}

export interface WorkHistory {
  id: string;
  company: string;
  title: string;
  startDate: string;
  endDate: string | null;
  current: boolean;
  description: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  startDate: string;
  endDate: string;
}

export interface Invitation {
  id: string;
  code: string;
  inviterId: string | null;
  inviter: { email: string; name: string } | null;
  inviteeEmail: string;
  inviteeId: string | null;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  createdAt: string;
  expiresAt: string;
  acceptedAt: string | null;
}

export interface Connection {
  id: string;
  name: string;
  title: string;
  trustScore: number;
  verified: boolean;
  mutualConnections: number;
  badges: string[];
}

export interface Notification {
  id: string;
  type: 'connection_request' | 'endorsement' | 'trust_score' | 'message' | 'verification';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actor?: {
    id: string;
    name: string;
    trustScore: number;
  };
}

export interface MarketplaceItem {
  id: string;
  vertical: 'earn' | 'build' | 'live' | 'protect';
  category: string;
  subcategory?: string;
  provider: {
    id: string;
    name: string;
    trustScore: number;
    verified: boolean;
    badges: string[];
  };
  title: string;
  description: string;
  location: string;
  rate?: string;
  salary?: string;
  seeking?: number;
  raised?: number;
  price?: string;
  coverage?: string;
  units?: number;
}

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

export interface Waqf {
  id: string;
  name: string;
  location: string;
  description: string;
  value: number;
  annualIncome: number;
  beneficiaries: number;
}

export interface QardHasanLoan {
  id: string;
  borrower: {
    id: string;
    name: string;
    trustScore: number;
    verified: boolean;
  };
  amount: number;
  purpose: string;
  term: number;
  repaid: number;
  lenders: number;
}

export interface FeedItem {
  id: string;
  type: 'job_posting' | 'venture_opportunity' | 'connection_update';
  author: {
    id: string;
    name: string;
    trustScore: number;
    verified: boolean;
  };
  title?: string;
  content: string;
  location?: string;
  salary?: string;
  fundingGoal?: number;
  fundingRaised?: number;
  postedAt: string;
  likes: number;
  comments: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: string[];
  };
}
