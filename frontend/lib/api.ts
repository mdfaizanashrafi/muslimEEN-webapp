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

// Generic fetch helper
async function fetchApi<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  };

  // Add CSRF token if available
  if (typeof window !== 'undefined') {
    const csrfToken = localStorage.getItem('muslimeen_csrf');
    if (csrfToken) {
      config.headers = {
        ...config.headers,
        'X-CSRF-Token': csrfToken,
      };
    }
  }

  const response = await fetch(url, config);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// Auth API
export const auth = {
  validateInvitation: (code: string): Promise<ValidateInvitationResponse> =>
    fetchApi('/auth/validate-invitation', {
      method: 'POST',
      body: JSON.stringify({ invitationCode: code }),
    }),

  login: (email: string, password: string, invitationCode?: string): Promise<LoginResponse> =>
    fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, invitationCode }),
    }),

  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    invitationCode: string;
  }): Promise<LoginResponse> =>
    fetchApi('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  logout: (): Promise<ApiResponse> =>
    fetchApi('/auth/logout', {
      method: 'POST',
    }),
};

// User API
export const user = {
  getProfile: (): Promise<ApiResponse<User>> =>
    fetchApi('/user/profile'),

  updateProfile: (data: Partial<User>): Promise<ApiResponse<User>> =>
    fetchApi('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  updateSettings: (settings: Record<string, unknown>): Promise<ApiResponse> =>
    fetchApi('/user/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),

  updateNotificationPreferences: (preferences: Record<string, boolean>): Promise<ApiResponse> =>
    fetchApi('/user/notifications', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    }),
};

// Marketplace API
export const marketplace = {
  getListings: (params?: { vertical?: string; status?: string }): Promise<ApiResponse> =>
    fetchApi(`/marketplace/listings?${new URLSearchParams(params as Record<string, string>)}`),

  getListing: (id: string): Promise<ApiResponse> =>
    fetchApi(`/marketplace/listings/${id}`),

  createListing: (data: Record<string, unknown>): Promise<ApiResponse> =>
    fetchApi('/marketplace/listings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateListing: (id: string, data: Record<string, unknown>): Promise<ApiResponse> =>
    fetchApi(`/marketplace/listings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteListing: (id: string): Promise<ApiResponse> =>
    fetchApi(`/marketplace/listings/${id}`, {
      method: 'DELETE',
    }),
};

// Verification API
export const verification = {
  getStatus: (): Promise<ApiResponse> =>
    fetchApi('/verification/status'),

  submitIdentity: (data: Record<string, unknown>): Promise<ApiResponse> =>
    fetchApi('/verification/identity', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  uploadDocument: (formData: FormData): Promise<ApiResponse> =>
    fetchApi('/verification/documents', {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set content-type for multipart
    }),
};

// Connections API
export const connections = {
  getConnections: (): Promise<ApiResponse> =>
    fetchApi('/connections'),

  getPendingRequests: (): Promise<ApiResponse> =>
    fetchApi('/connections/pending'),

  sendRequest: (userId: string, message?: string): Promise<ApiResponse> =>
    fetchApi('/connections/request', {
      method: 'POST',
      body: JSON.stringify({ userId, message }),
    }),

  acceptRequest: (connectionId: string): Promise<ApiResponse> =>
    fetchApi(`/connections/${connectionId}/accept`, {
      method: 'POST',
    }),

  declineRequest: (connectionId: string): Promise<ApiResponse> =>
    fetchApi(`/connections/${connectionId}/decline`, {
      method: 'POST',
    }),

  removeConnection: (connectionId: string): Promise<ApiResponse> =>
    fetchApi(`/connections/${connectionId}`, {
      method: 'DELETE',
    }),
};

// Messages API
export const messages = {
  getConversations: (): Promise<ApiResponse> =>
    fetchApi('/messages/conversations'),

  getMessages: (conversationId: string): Promise<ApiResponse> =>
    fetchApi(`/messages/conversations/${conversationId}`),

  sendMessage: (conversationId: string, content: string): Promise<ApiResponse> =>
    fetchApi(`/messages/conversations/${conversationId}`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),

  markAsRead: (conversationId: string): Promise<ApiResponse> =>
    fetchApi(`/messages/conversations/${conversationId}/read`, {
      method: 'POST',
    }),
};
