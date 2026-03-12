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
};

// ============================================================================
// PROFILE API
// ============================================================================

export const profile = {
  getCurrentProfile: (): Promise<{ success: boolean; profile: Profile }> =>
    callMuslimEenApi('/users/me'),

  updateProfile: (profileUpdates: Partial<Profile>): Promise<{ success: boolean; profile: Profile; message: string }> =>
    callMuslimEenApi('/users/me', {
      method: 'PUT',
      body: JSON.stringify(profileUpdates),
    }),

  getPublicProfile: (userId: string): Promise<{ success: boolean; profile: Partial<Profile> }> =>
    callMuslimEenApi(`/users/${userId}/profile`),
};

// ============================================================================
// USER API (General)
// ============================================================================

export const user = {
  getProfile: (): Promise<{ success: boolean; profile: Profile }> =>
    callMuslimEenApi('/users/me'),

  updateProfile: (profileUpdates: Partial<Profile>): Promise<{ success: boolean; profile: Profile; message: string }> =>
    callMuslimEenApi('/users/me', {
      method: 'PUT',
      body: JSON.stringify(profileUpdates),
    }),
};

// ============================================================================
// TRUST SCORE API
// ============================================================================

export const trustScore = {
  getCurrentScore: (): Promise<TrustScoreData> =>
    callMuslimEenApi('/users/me/trust-score'),

  getHistory: (): Promise<{ success: boolean; history: Array<{ date: string; score: number }> }> =>
    callMuslimEenApi('/users/me/trust-score/history'),

  recalculate: (): Promise<{ success: boolean; score: number; previousScore: number; changed: boolean; witnessEligibilityChanged: boolean; factors: Array<{ name: string; score: number; weight: number }> }> =>
    callMuslimEenApi('/users/me/trust-score/recalculate', {
      method: 'POST',
    }),
};

// ============================================================================
// CONNECTIONS API
// ============================================================================

export const connections = {
  getConnections: (): Promise<Connection[]> =>
    callMuslimEenApi('/users/me/connections'),

  getPendingRequests: (): Promise<PendingConnection[]> =>
    callMuslimEenApi('/users/me/connections/pending'),

  sendRequest: (recipientId: string): Promise<{ success: boolean; message: string }> =>
    callMuslimEenApi('/users/me/connections', {
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

  getListing: (vertical: string, listingId: string): Promise<{ success: boolean; listing: unknown }> =>
    callMuslimEenApi(`/marketplace/${vertical}/${listingId}`),

  createListing: (vertical: string, listingData: Record<string, unknown>): Promise<{ success: boolean; listing: unknown; message: string }> =>
    callMuslimEenApi(`/marketplace/${vertical}`, {
      method: 'POST',
      body: JSON.stringify(listingData),
    }),

  updateListing: (vertical: string, listingId: string, listingUpdates: Record<string, unknown>): Promise<{ success: boolean; listing: unknown; message: string }> =>
    callMuslimEenApi(`/marketplace/${vertical}/${listingId}`, {
      method: 'PUT',
      body: JSON.stringify(listingUpdates),
    }),

  deleteListing: (vertical: string, listingId: string): Promise<{ success: boolean; message: string }> =>
    callMuslimEenApi(`/marketplace/${vertical}/${listingId}`, {
      method: 'DELETE',
    }),

  invest: (vertical: string, listingId: string, amount: number): Promise<{ success: boolean; message: string }> =>
    callMuslimEenApi(`/marketplace/${vertical}/${listingId}/invest`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    }),
};

// ============================================================================
// ISLAMIC FINANCE API
// ============================================================================

export const islamicFinance = {
  // Sadaqah
  getSadaqahCampaigns: (): Promise<{ success: boolean; campaigns: SadaqahCampaign[] }> =>
    callMuslimEenApi('/islamic-finance/sadaqah'),

  donate: (campaignId: string, amount: number, anonymous?: boolean, message?: string): Promise<{ success: boolean; donation: unknown; message: string }> =>
    callMuslimEenApi(`/islamic-finance/sadaqah/${campaignId}/donate`, {
      method: 'POST',
      body: JSON.stringify({ amount, anonymous, message }),
    }),

  // Waqf
  getWaqfListings: (): Promise<{ success: boolean; waqf: WaqfListing[] }> =>
    callMuslimEenApi('/islamic-finance/waqf'),

  // Qard Hasan
  getQardHasanLoans: (): Promise<{ success: boolean; loans: QardHasanLoan[] }> =>
    callMuslimEenApi('/islamic-finance/qard-hasan'),

  createQardHasanLoan: (loanData: { amount: number; purpose: string; duration: number }): Promise<{ success: boolean; loan: QardHasanLoan }> =>
    callMuslimEenApi('/islamic-finance/qard-hasan', {
      method: 'POST',
      body: JSON.stringify(loanData),
    }),

  // Zakat
  calculateZakat: (assets: { gold?: number; silver?: number; cash?: number; investments?: number; businessInventory?: number; debts?: number }): Promise<{ success: boolean; calculation: { totalAssets: number; totalDebts: number; netWealth: number; zakatDue: number; nisabThreshold: number; meetsNisab: boolean } }> =>
    callMuslimEenApi('/islamic-finance/zakat/calculate', {
      method: 'POST',
      body: JSON.stringify(assets),
    }),
};

// ============================================================================
// VERIFICATION API
// ============================================================================

export const verification = {
  requestBiometric: (): Promise<{ success: boolean; message: string; sessionId?: string }> =>
    callMuslimEenApi('/verification/biometric/request', {
      method: 'POST',
    }),

  completeBiometric: (sessionId: string, verificationData: unknown): Promise<{ success: boolean; message: string }> =>
    callMuslimEenApi('/verification/biometric/complete', {
      method: 'POST',
      body: JSON.stringify({ sessionId, ...verificationData }),
    }),

  requestBusiness: (businessData: Record<string, unknown>): Promise<{ success: boolean; message: string }> =>
    callMuslimEenApi('/verification/business/request', {
      method: 'POST',
      body: JSON.stringify(businessData),
    }),
};

// ============================================================================
// NOTIFICATIONS API (Placeholder - update when backend is ready)
// ============================================================================

export const notifications = {
  getNotifications: (): Promise<{ success: boolean; notifications: unknown[] }> =>
    callMuslimEenApi('/user/notifications'),

  markAsRead: (notificationId: string): Promise<{ success: boolean; message: string }> =>
    callMuslimEenApi(`/user/notifications/${notificationId}/read`, {
      method: 'POST',
    }),
};

// ============================================================================
// MESSAGES API (Placeholder - update when backend is ready)
// ============================================================================

export const messages = {
  getConversations: (): Promise<{ success: boolean; conversations: unknown[] }> =>
    Promise.resolve({ success: true, conversations: [] }),

  getMessages: (conversationId: string): Promise<{ success: boolean; messages: unknown[] }> =>
    Promise.resolve({ success: true, messages: [] }),

  sendMessage: (conversationId: string, content: string): Promise<{ success: boolean; message: unknown }> =>
    Promise.resolve({ success: true, message: { id: 'temp', content, createdAt: new Date().toISOString() } }),
};
