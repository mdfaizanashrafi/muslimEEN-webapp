// MuslimEEN API Client
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
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
  displayName: string;
  trustScore: number;
  verificationLevel: 'provisional' | 'verified' | 'business' | 'institutional';
  role: 'user' | 'admin' | 'moderator';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ValidateInvitationResponse {
  success: boolean;
  message?: string;
  valid?: boolean;
  email?: string;
  maxUses?: number;
  usedCount?: number;
}

// Generic API request helper
async function callMuslimEenApi<T>(
  endpoint: string, 
  requestConfig: RequestInit = {}
): Promise<T> {
  const apiUrl = `${API_BASE_URL}${endpoint}`;
  
  const httpConfig: RequestInit = {
    ...requestConfig,
    headers: {
      'Content-Type': 'application/json',
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
    throw new Error(errorData.message || `HTTP error! status: ${httpResponse.status}`);
  }

  return httpResponse.json();
}

// Auth API
export const auth = {
  validateInvitation: (invitationCode: string): Promise<ValidateInvitationResponse> =>
    callMuslimEenApi('/auth/validate-invitation', {
      method: 'POST',
      body: JSON.stringify({ invitationCode }),
    }),

  login: (email: string, password: string, invitationCode?: string): Promise<LoginResponse> =>
    callMuslimEenApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, invitationCode }),
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
};

// User API
export const user = {
  getProfile: (): Promise<ApiResponse<User>> =>
    callMuslimEenApi('/user/profile'),

  updateProfile: (profileUpdates: Partial<User>): Promise<ApiResponse<User>> =>
    callMuslimEenApi('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(profileUpdates),
    }),

  updateSettings: (userSettings: Record<string, unknown>): Promise<ApiResponse> =>
    callMuslimEenApi('/user/settings', {
      method: 'PUT',
      body: JSON.stringify(userSettings),
    }),

  updateNotificationPreferences: (notificationPreferences: Record<string, boolean>): Promise<ApiResponse> =>
    callMuslimEenApi('/user/notifications', {
      method: 'PUT',
      body: JSON.stringify(notificationPreferences),
    }),
};

// Marketplace API
export const marketplace = {
  getListings: (filterParams?: { vertical?: string; status?: string }): Promise<ApiResponse> =>
    callMuslimEenApi(`/marketplace/listings?${new URLSearchParams(filterParams as Record<string, string>)}`),

  getListing: (listingId: string): Promise<ApiResponse> =>
    callMuslimEenApi(`/marketplace/listings/${listingId}`),

  createListing: (listingData: Record<string, unknown>): Promise<ApiResponse> =>
    callMuslimEenApi('/marketplace/listings', {
      method: 'POST',
      body: JSON.stringify(listingData),
    }),

  updateListing: (listingId: string, listingUpdates: Record<string, unknown>): Promise<ApiResponse> =>
    callMuslimEenApi(`/marketplace/listings/${listingId}`, {
      method: 'PUT',
      body: JSON.stringify(listingUpdates),
    }),

  deleteListing: (listingId: string): Promise<ApiResponse> =>
    callMuslimEenApi(`/marketplace/listings/${listingId}`, {
      method: 'DELETE',
    }),
};

// Verification API
export const verification = {
  getStatus: (): Promise<ApiResponse> =>
    callMuslimEenApi('/verification/status'),

  submitIdentity: (identityData: Record<string, unknown>): Promise<ApiResponse> =>
    callMuslimEenApi('/verification/identity', {
      method: 'POST',
      body: JSON.stringify(identityData),
    }),

  uploadDocument: (documentFormData: FormData): Promise<ApiResponse> =>
    callMuslimEenApi('/verification/documents', {
      method: 'POST',
      body: documentFormData,
      headers: {}, // Let browser set content-type for multipart
    }),
};

// Connections API
export const connections = {
  getConnections: (): Promise<ApiResponse> =>
    callMuslimEenApi('/connections'),

  getPendingRequests: (): Promise<ApiResponse> =>
    callMuslimEenApi('/connections/pending'),

  sendRequest: (targetUserId: string, requestMessage?: string): Promise<ApiResponse> =>
    callMuslimEenApi('/connections/request', {
      method: 'POST',
      body: JSON.stringify({ userId: targetUserId, message: requestMessage }),
    }),

  acceptRequest: (connectionId: string): Promise<ApiResponse> =>
    callMuslimEenApi(`/connections/${connectionId}/accept`, {
      method: 'POST',
    }),

  declineRequest: (connectionId: string): Promise<ApiResponse> =>
    callMuslimEenApi(`/connections/${connectionId}/decline`, {
      method: 'POST',
    }),

  removeConnection: (connectionId: string): Promise<ApiResponse> =>
    callMuslimEenApi(`/connections/${connectionId}`, {
      method: 'DELETE',
    }),
};

// Messages API
export const messages = {
  getConversations: (): Promise<ApiResponse> =>
    callMuslimEenApi('/messages/conversations'),

  getMessages: (conversationId: string): Promise<ApiResponse> =>
    callMuslimEenApi(`/messages/conversations/${conversationId}`),

  sendMessage: (conversationId: string, messageContent: string): Promise<ApiResponse> =>
    callMuslimEenApi(`/messages/conversations/${conversationId}`, {
      method: 'POST',
      body: JSON.stringify({ content: messageContent }),
    }),

  markAsRead: (conversationId: string): Promise<ApiResponse> =>
    callMuslimEenApi(`/messages/conversations/${conversationId}/read`, {
      method: 'POST',
    }),
};
