// MuslimEEN API Client - Production Ready
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// ============================================================================
// TYPES
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  token: string;
  csrfToken: string;
  user: User;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  trustScore: number;
  verificationTier: 'basic' | 'verified' | 'business' | 'institutional';
  role: 'user' | 'admin' | 'moderator' | 'muslim_verified' | 'muslim_unverified' | 'non_muslim';
  isActive: boolean;
  invitesRemaining: number;
  createdAt: string;
  updatedAt: string;
}

export interface Profile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  bio?: string;
  location?: string;
  industry?: string;
  skills: string[];
  endorsements: number;
  createdAt: string;
  updatedAt?: string;
}

export interface TrustScoreData {
  success: boolean;
  score: number;
  factors: Array<{
    name: string;
    score: number;
    weight: number;
  }>;
}

export interface Connection {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  trustScore: number;
  verificationTier: string;
  industry?: string;
  connectedAt: string;
}

export interface PendingConnection {
  id: string;
  requesterId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  trustScore: number;
  message?: string;
  requestedAt: string;
}

export interface SadaqahCampaign {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  raisedAmount: number;
  beneficiary: string;
  category: string;
  endDate?: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
}

export interface WaqfListing {
  id: string;
  title: string;
  description: string;
  assetType: string;
  value: number;
  location: string;
  incomeGenerated: number;
  createdAt: string;
}

export interface QardHasanLoan {
  id: string;
  borrowerId: string;
  borrowerName: string;
  amount: number;
  purpose: string;
  status: 'pending' | 'funded' | 'repaid';
  lenderId?: string;
  lenderName?: string;
  createdAt: string;
  fundedAt?: string;
}

export interface Invite {
  id: string;
  code: string;
  email?: string;
  usedCount: number;
  maxUses: number;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
}

export interface ValidateInvitationResponse {
  success: boolean;
  message?: string;
  valid?: boolean;
  email?: string;
  maxUses?: number;
  usedCount?: number;
}

// ============================================================================
// API REQUEST HELPER
// ============================================================================

async function callMuslimEenApi<T>(
  endpoint: string,
  requestConfig: RequestInit = {}
): Promise<T> {
  const apiUrl = `${API_BASE_URL}${endpoint}`;

  // Get auth token from localStorage
  const authToken = typeof window !== 'undefined' ? localStorage.getItem('muslimeen_token') : null;

  const httpConfig: RequestInit = {
    ...requestConfig,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
      ...requestConfig.headers,
    },
    credentials: 'include',
  };

  // Add CSRF token if available
  if (typeof window !== 'undefined') {
    const storedCsrfToken = localStorage.getItem('muslimeen_csrf');
    if (storedCsrfToken) {
      httpConfig.headers = {
        ...httpConfig.headers,
        'X-CSRF-Token': storedCsrfToken,
      };
    }
  }

  const httpResponse = await fetch(apiUrl, httpConfig);

  if (!httpResponse.ok) {
    const errorData = await httpResponse.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error?.message || `HTTP error! status: ${httpResponse.status}`);
  }

  return httpResponse.json();
}

// ============================================================================
// AUTH API
// ============================================================================

export const auth = {
  validateInvitation: (invitationCode: string): Promise<ValidateInvitationResponse> =>
    callMuslimEenApi('/auth/validate-invitation', {
      method: 'POST',
      body: JSON.stringify({ invitationCode }),
    }),

  login: (email: string, password: string): Promise<LoginResponse> =>
    callMuslimEenApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (registrationData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    invitationCode: string;
  }): Promise<LoginResponse> =>
    callMuslimEenApi('/auth/register', {
      method: 'POST',
      body: JSON.stringify(registrationData),
    }),

  logout: (): Promise<ApiResponse> =>
    callMuslimEenApi('/auth/logout', {
      method: 'POST',
    }),

  getCurrentUser: (): Promise<ApiResponse<User>> =>
    callMuslimEenApi('/auth/me'),

  getCsrfToken: (): Promise<{ success: boolean; csrfToken: string }> =>
    callMuslimEenApi('/auth/csrf-token'),
};

// ============================================================================
// USERS API
// ============================================================================

export const users = {
  // Current user profile
  getMe: (): Promise<{ success: boolean; profile: Profile }> =>
    callMuslimEenApi('/users/me'),

  updateMe: (profileUpdates: Partial<Profile>): Promise<{ success: boolean; profile: Profile; message: string }> =>
    callMuslimEenApi('/users/me', {
      method: 'PUT',
      body: JSON.stringify(profileUpdates),
    }),

  // Trust score
  getTrustScore: (): Promise<TrustScoreData> =>
    callMuslimEenApi('/users/me/trust-score'),

  getTrustScoreHistory: (): Promise<{ success: boolean; history: Array<{ date: string; score: number }> }> =>
    callMuslimEenApi('/users/me/trust-score/history'),

  recalculateTrustScore: (): Promise<{ success: boolean; score: number; previousScore: number; changed: boolean; witnessEligibilityChanged: boolean; factors: Array<{ name: string; score: number; weight: number }> }> =>
    callMuslimEenApi('/users/me/trust-score/recalculate', {
      method: 'POST',
    }),

  // Verification
  getVerificationStatus: (): Promise<{ success: boolean; status: string }> =>
    callMuslimEenApi('/users/me/verification'),

  requestBiometricVerification: (): Promise<ApiResponse> =>
    callMuslimEenApi('/users/me/verification/biometric/request', {
      method: 'POST',
    }),

  completeBiometricVerification: (data: { sessionId: string; proof: string }): Promise<ApiResponse> =>
    callMuslimEenApi('/users/me/verification/biometric/complete', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  requestBusinessVerification: (documents: string[]): Promise<ApiResponse> =>
    callMuslimEenApi('/users/me/verification/business/request', {
      method: 'POST',
      body: JSON.stringify({ documents }),
    }),

  // Public profile
  getPublicProfile: (userId: string): Promise<{ success: boolean; profile: Partial<Profile> }> =>
    callMuslimEenApi(`/users/${userId}`),
};

// ============================================================================
// CONNECTIONS API
// ============================================================================

export const connections = {
  getConnections: (): Promise<Connection[]> =>
    callMuslimEenApi('/connections'),

  getPendingRequests: (): Promise<PendingConnection[]> =>
    callMuslimEenApi('/connections/pending'),

  sendRequest: (recipientId: string): Promise<{ success: boolean; message: string }> =>
    callMuslimEenApi('/connections', {
      method: 'POST',
      body: JSON.stringify({ recipientId }),
    }),

  acceptRequest: (connectionId: string): Promise<{ success: boolean; message: string }> =>
    callMuslimEenApi(`/connections/${connectionId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'accepted' }),
    }),

  rejectRequest: (connectionId: string): Promise<{ success: boolean; message: string }> =>
    callMuslimEenApi(`/connections/${connectionId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'rejected' }),
    }),

  removeConnection: (connectionId: string): Promise<{ success: boolean; message: string }> =>
    callMuslimEenApi(`/connections/${connectionId}`, {
      method: 'DELETE',
    }),
};

// ============================================================================
// INVITES API
// ============================================================================

export const invites = {
  getUserInvites: (): Promise<{ success: boolean; invites: Invite[] }> =>
    callMuslimEenApi('/invites'),

  createInvite: (email?: string): Promise<{ success: boolean; invite: Invite; message: string }> =>
    callMuslimEenApi('/invites', {
      method: 'POST',
      body: JSON.stringify(email ? { email } : {}),
    }),

  getQuota: (): Promise<{ success: boolean; quota: { used: number; remaining: number; total: number } }> =>
    callMuslimEenApi('/invites/quota'),

  revokeInvite: (inviteId: string): Promise<{ success: boolean; message: string }> =>
    callMuslimEenApi(`/invites/${inviteId}`, {
      method: 'DELETE',
    }),

  validateInvite: (token: string): Promise<{ success: boolean; valid: boolean; email?: string; message?: string }> =>
    callMuslimEenApi(`/invites/validate/${token}`),
};

// ============================================================================
// MARKETPLACE API
// ============================================================================

export const marketplace = {
  getListings: (vertical: string): Promise<{ success: boolean; listings: unknown[] }> =>
    callMuslimEenApi(`/marketplace/${vertical}`),

  getListingById: (vertical: string, id: string): Promise<{ success: boolean; listing: unknown }> =>
    callMuslimEenApi(`/marketplace/${vertical}/${id}`),

  createListing: (vertical: string, listingData: unknown): Promise<{ success: boolean; listing: unknown; message: string }> =>
    callMuslimEenApi(`/marketplace/${vertical}`, {
      method: 'POST',
      body: JSON.stringify(listingData),
    }),

  updateListing: (vertical: string, id: string, listingData: unknown): Promise<{ success: boolean; listing: unknown; message: string }> =>
    callMuslimEenApi(`/marketplace/${vertical}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(listingData),
    }),

  removeListing: (vertical: string, id: string): Promise<{ success: boolean; message: string }> =>
    callMuslimEenApi(`/marketplace/${vertical}/${id}`, {
      method: 'DELETE',
    }),

  recordInvestment: (vertical: string, id: string, amount: number): Promise<{ success: boolean; message: string }> =>
    callMuslimEenApi(`/marketplace/${vertical}/${id}/invest`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    }),
};

// ============================================================================
// ISLAMIC FINANCE API
// ============================================================================

export const islamicFinance = {
  getSadaqahCampaigns: (): Promise<{ success: boolean; campaigns: SadaqahCampaign[] }> =>
    callMuslimEenApi('/islamic-finance/sadaqah'),

  donate: (campaignId: string, amount: number): Promise<{ success: boolean; message: string }> =>
    callMuslimEenApi(`/islamic-finance/sadaqah/${campaignId}/donate`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    }),

  getWaqfListings: (): Promise<{ success: boolean; listings: WaqfListing[] }> =>
    callMuslimEenApi('/islamic-finance/waqf'),

  getQardHasanLoans: (): Promise<{ success: boolean; loans: QardHasanLoan[] }> =>
    callMuslimEenApi('/islamic-finance/qard-hasan'),

  createQardHasanLoan: (loanData: { amount: number; purpose: string }): Promise<{ success: boolean; loan: QardHasanLoan; message: string }> =>
    callMuslimEenApi('/islamic-finance/qard-hasan', {
      method: 'POST',
      body: JSON.stringify(loanData),
    }),

  calculateZakat: (assets: { gold?: number; silver?: number; cash?: number; investments?: number; businessAssets?: number }): Promise<{ success: boolean; zakatAmount: number; totalAssets: number; nisabThreshold: number; isZakatDue: boolean }> =>
    callMuslimEenApi('/islamic-finance/zakat/calculate', {
      method: 'POST',
      body: JSON.stringify(assets),
    }),
};

// ============================================================================
// LEGACY EXPORTS (for backward compatibility during migration)
// ============================================================================

/** @deprecated Use `users` instead */
export const profile = users;

/** @deprecated Use `users` instead */
export const user = users;

/** @deprecated Use `users.getTrustScore` instead */
export const trustScore = {
  getCurrentScore: users.getTrustScore,
  getHistory: users.getTrustScoreHistory,
  recalculate: users.recalculateTrustScore,
};
