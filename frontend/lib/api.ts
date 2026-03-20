// MuslimEEN API Client - CLERK VERSION
// MIGRATED: Removed CSRF handling (Clerk manages auth via JWT)
// DATE: 2026-03-20
// SECURITY: Uses Clerk's JWT for auth, automatic retry logic, production observable
// HARDENED: Race-condition safe, offline detection, cleanup

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// ============================================================================
// GLOBAL STATE & CIRCUIT BREAKER
// ============================================================================

/**
 * Global retry limit to prevent retry storms when backend is down
 * Resets on page reload
 */
const MAX_TOTAL_RETRIES = 5;
let globalRetryCount = 0;
let circuitOpen = false;

/**
 * Check if we've exceeded the global retry limit
 */
function checkCircuitBreaker(): boolean {
  if (circuitOpen) {
    return true;
  }
  if (globalRetryCount >= MAX_TOTAL_RETRIES) {
    circuitOpen = true;
    if (typeof window !== 'undefined') {
      console.warn(`[API] Circuit breaker triggered after ${MAX_TOTAL_RETRIES} retries`);
    }
    return true;
  }
  return false;
}

/**
 * Increment global retry counter
 */
function incrementGlobalRetry(): void {
  globalRetryCount++;
}

/**
 * Reset circuit breaker (call when connection restored)
 */
function resetCircuitBreaker(): void {
  globalRetryCount = 0;
  circuitOpen = false;
  if (typeof window !== 'undefined') {
    console.debug('[API] Circuit breaker reset');
  }
}

// ============================================================================
// OFFLINE DETECTION
// ============================================================================

/**
 * Current online status
 */
let isOnline = typeof window !== 'undefined' ? navigator.onLine : true;

/**
 * Check if browser is online
 */
function getOnlineStatus(): boolean {
  return isOnline;
}

/**
 * Initialize offline/online listeners
 * Call this once in your app root
 */
function initOfflineDetection(): void {
  if (typeof window === 'undefined') return;

  window.addEventListener('offline', () => {
    isOnline = false;
    if (typeof window !== 'undefined') {
      console.debug('[API] Browser went offline');
      const { addBreadcrumb } = require('./sentry');
      addBreadcrumb('Browser went offline', 'network', 'warning');
    }
  });

  window.addEventListener('online', () => {
    isOnline = true;
    resetCircuitBreaker();
    if (typeof window !== 'undefined') {
      console.debug('[API] Browser came online');
      const { addBreadcrumb } = require('./sentry');
      addBreadcrumb('Browser came online', 'network', 'info');
    }
  });
}

// Auto-initialize if in browser
if (typeof window !== 'undefined') {
  initOfflineDetection();
}

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
    details?: string[];
  };
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  user: User;
  csrfToken: string;
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
// NETWORK RELIABILITY CONFIGURATION
// ============================================================================

// Request timeout in milliseconds (30 seconds)
const REQUEST_TIMEOUT = 30000;

// Safe request retry configuration
const SAFE_RETRY_CONFIG = {
  maxRetries: 2,
  baseDelay: 1000, // 1 second
  maxDelay: 5000,  // 5 seconds
};

// Track retry metrics for observability
interface RetryMetrics {
  retryAttempts: number;
  retrySuccesses: number;
  retryFailures: number;
}

const retryMetrics: RetryMetrics = {
  retryAttempts: 0,
  retrySuccesses: 0,
  retryFailures: 0,
};

/**
 * Log retry metrics (for debugging and monitoring)
 */
function logRetryMetrics(): void {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.debug('[Retry Metrics]', { ...retryMetrics });
  }
}

// ============================================================================
// GLOBAL AUTH ERROR HANDLER
// ============================================================================

/**
 * Global auth error handler - set by auth-context or components
 */
let globalAuthErrorHandler: ((error: ApiError) => void) | null = null;

/**
 * Register global auth error handler
 */
function registerGlobalAuthErrorHandler(handler: (error: ApiError) => void): void {
  globalAuthErrorHandler = handler;
}

/**
 * Handle auth error globally
 */
function handleAuthError(error: ApiError): void {
  if (globalAuthErrorHandler) {
    globalAuthErrorHandler(error);
  }
}

// ============================================================================
// ERROR CLASSIFICATION & USER MESSAGES
// ============================================================================

export enum ApiErrorType {
  TIMEOUT = 'TIMEOUT',
  NETWORK = 'NETWORK',
  OFFLINE = 'OFFLINE',
  SERVER = 'SERVER',
  AUTH = 'AUTH',
  CSRF = 'CSRF',  // DEPRECATED: Kept for backward compatibility
  VALIDATION = 'VALIDATION',
  SYSTEM_UNAVAILABLE = 'SYSTEM_UNAVAILABLE',
  ABORTED = 'ABORTED',
  UNKNOWN = 'UNKNOWN',
}

export interface ApiError extends Error {
  type: ApiErrorType;
  statusCode?: number;
  userMessage: string;
  retryable: boolean;
}

/**
 * Create structured API error with user-friendly message
 */
function createApiError(
  originalError: Error,
  type: ApiErrorType,
  statusCode?: number,
  customMessage?: string
): ApiError {
  const userMessages: Record<ApiErrorType, string> = {
    [ApiErrorType.TIMEOUT]: 'Server is taking too long to respond. Please try again.',
    [ApiErrorType.NETWORK]: 'Connection issue. Please check your internet and try again.',
    [ApiErrorType.OFFLINE]: 'You are offline. Check your internet connection.',
    [ApiErrorType.SERVER]: 'Something went wrong on our end. Please try again in a moment.',
    [ApiErrorType.AUTH]: 'Your session has expired. Please log in again.',
    [ApiErrorType.CSRF]: 'Security token expired. Please refresh the page and try again.',
    [ApiErrorType.VALIDATION]: customMessage || 'Please check your input and try again.',
    [ApiErrorType.SYSTEM_UNAVAILABLE]: 'Service temporarily unavailable. Please try again later.',
    [ApiErrorType.ABORTED]: 'Request was cancelled.',
    [ApiErrorType.UNKNOWN]: 'Something went wrong. Please try again.',
  };

  const error = new Error(originalError.message) as ApiError;
  error.type = type;
  error.statusCode = statusCode;
  error.userMessage = userMessages[type];
  error.retryable = [ApiErrorType.TIMEOUT, ApiErrorType.NETWORK, ApiErrorType.SERVER].includes(type);

  return error;
}

/**
 * Calculate exponential backoff delay
 */
function getRetryDelay(attempt: number): number {
  const delay = Math.min(
    SAFE_RETRY_CONFIG.baseDelay * Math.pow(2, attempt),
    SAFE_RETRY_CONFIG.maxDelay
  );
  // Add jitter to prevent thundering herd
  return delay + Math.random() * 1000;
}

/**
 * Execute single API request with timeout and error handling
 * Supports external AbortController for request cancellation
 */
async function executeRequest<T>(
  apiUrl: string,
  httpConfig: RequestInit,
  endpoint: string,
  method: string,
  externalSignal?: AbortSignal
): Promise<{ success: true; data: T } | { success: false; error: ApiError }> {
  // Check offline status before making request
  if (!isOnline) {
    const offlineError = createApiError(
      new Error('Browser is offline'),
      ApiErrorType.OFFLINE
    );
    return { success: false, error: offlineError };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  // Combine external signal with internal controller
  if (externalSignal) {
    externalSignal.addEventListener('abort', () => {
      controller.abort();
    });
  }

  try {
    const httpResponse = await fetch(apiUrl, {
      ...httpConfig,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!httpResponse.ok) {
      const errorData = await httpResponse.json().catch(() => ({}));
      const errorMessage = errorData.message || errorData.error?.message || `HTTP error! status: ${httpResponse.status}`;
      
      // Classify error type
      let errorType = ApiErrorType.UNKNOWN;
      if (httpResponse.status === 401) errorType = ApiErrorType.AUTH;
      else if (httpResponse.status >= 400 && httpResponse.status < 500) errorType = ApiErrorType.VALIDATION;
      else if (httpResponse.status >= 500) errorType = ApiErrorType.SERVER;

      const apiError = createApiError(new Error(errorMessage), errorType, httpResponse.status);
      
      // Trigger global auth error handler for 401s
      if (errorType === ApiErrorType.AUTH) {
        handleAuthError(apiError);
      }
      
      return { success: false, error: apiError };
    }

    const data = await httpResponse.json();
    return { success: true, data };
  } catch (error) {
    clearTimeout(timeoutId);

    // Handle abort (from unmount or timeout)
    if (error instanceof Error && error.name === 'AbortError') {
      // Check if it was from external signal (unmount) or timeout
      if (externalSignal?.aborted) {
        const abortError = createApiError(
          new Error('Request cancelled'),
          ApiErrorType.ABORTED
        );
        return { success: false, error: abortError };
      }
      
      const timeoutError = createApiError(
        new Error('Request timeout'),
        ApiErrorType.TIMEOUT
      );
      return { success: false, error: timeoutError };
    }

    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      const networkError = createApiError(
        error as Error,
        ApiErrorType.NETWORK
      );
      return { success: false, error: networkError };
    }

    // Unknown error
    const unknownError = createApiError(
      error instanceof Error ? error : new Error(String(error)),
      ApiErrorType.UNKNOWN
    );
    return { success: false, error: unknownError };
  }
}

/**
 * API Request Configuration
 */
export interface RequestOptions {
  signal?: AbortSignal;
  skipCircuitBreaker?: boolean;
}

/**
 * Make API request with hardened error handling and safe retry logic
 * MIGRATED: Removed CSRF handling - Clerk manages auth via JWT cookies
 * 
 * RELIABILITY: Race-condition safe, safe retry, production observable
 * HARDENED: Circuit breaker, offline detection, abort support
 */
async function callMuslimEenApi<T>(
  endpoint: string,
  requestConfig: RequestInit = {},
  options: RequestOptions = {}
): Promise<T> {
  const { signal: externalSignal, skipCircuitBreaker = false } = options;
  const apiUrl = `${API_BASE_URL}${endpoint}`;
  const method = requestConfig.method || 'GET';
  const isSafeRequest = method === 'GET' || method === 'HEAD';

  // Check circuit breaker (unless skipped for critical requests)
  if (!skipCircuitBreaker && checkCircuitBreaker()) {
    const systemError = createApiError(
      new Error('Circuit breaker open'),
      ApiErrorType.SYSTEM_UNAVAILABLE
    );
    throw systemError;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...requestConfig.headers as Record<string, string>,
  };

  // NOTE: Clerk automatically adds Authorization header with JWT
  // No manual CSRF token handling needed

  let safeRetryCount = 0;
  const maxSafeRetries = isSafeRequest ? SAFE_RETRY_CONFIG.maxRetries : 0;

  while (true) {
    // Check if external abort signal triggered
    if (externalSignal?.aborted) {
      const abortError = createApiError(
        new Error('Request cancelled'),
        ApiErrorType.ABORTED
      );
      throw abortError;
    }

    const httpConfig: RequestInit = {
      ...requestConfig,
      headers,
      credentials: 'include', // Clerk sets session cookie automatically
    };

    const result = await executeRequest<T>(apiUrl, httpConfig, endpoint, method, externalSignal);

    if (result.success) {
      return result.data;
    }

    const error = result.error;

    // Don't retry aborted requests
    if (error.type === ApiErrorType.ABORTED) {
      throw error;
    }

    // Handle safe request retries with exponential backoff
    if (error.retryable && isSafeRequest && safeRetryCount < maxSafeRetries) {
      // Check circuit breaker before retry
      if (checkCircuitBreaker()) {
        const systemError = createApiError(
          new Error('Too many retries'),
          ApiErrorType.SYSTEM_UNAVAILABLE
        );
        throw systemError;
      }

      safeRetryCount++;
      incrementGlobalRetry();
      const delay = getRetryDelay(safeRetryCount);

      if (typeof window !== 'undefined') {
        console.debug(`[API] Retrying ${method} ${endpoint} (attempt ${safeRetryCount}/${maxSafeRetries}) after ${delay}ms`);
        const { addBreadcrumb } = require('./sentry');
        addBreadcrumb(`Safe retry ${safeRetryCount}/${maxSafeRetries} for ${endpoint}`, 'api', 'warning');
      }

      await new Promise(resolve => setTimeout(resolve, delay));
      continue;
    }

    // Log final error to Sentry
    if (typeof window !== 'undefined') {
      const { captureError } = require('./sentry');
      captureError(error, {
        endpoint,
        method,
        errorType: error.type,
        safeRetries: safeRetryCount,
        globalRetries: globalRetryCount,
      });
    }

    throw error;
  }
}

// ============================================================================
// AUTH API
// ============================================================================

export const auth = {
  /**
   * Validate invitation code
   * NOTE: With Clerk, this is optional. Invitations can be enforced via webhooks.
   */
  validateInvitation: (invitationCode: string): Promise<ValidateInvitationResponse> =>
    callMuslimEenApi('/auth/validate-invitation', {
      method: 'POST',
      body: JSON.stringify({ invitationCode }),
    }),

  /**
   * Get current user
   * MIGRATED: Clerk session is sent automatically via cookie
   */
  getCurrentUser: (): Promise<ApiResponse<{ user: User }>> =>
    callMuslimEenApi('/auth/me'),

  /**
   * Logout user
   * NOTE: Frontend should call Clerk's signOut() first, then this for backend cleanup
   */
  logout: (): Promise<ApiResponse> =>
    callMuslimEenApi('/auth/logout', {
      method: 'POST',
    }),

  /**
   * DEPRECATED: Login is now handled by Clerk's useSignIn hook
   * Kept for backward compatibility during migration
   */
  login: (_email: string, _password: string): Promise<LoginResponse> => {
    console.warn('[API] auth.login() is deprecated. Use Clerk\'s useSignIn() hook instead.');
    return Promise.reject(new Error('Use Clerk\'s useSignIn() hook'));
  },

  /**
   * DEPRECATED: Registration is now handled by Clerk
   * Kept for backward compatibility during migration
   */
  register: (_data: unknown): Promise<LoginResponse> => {
    console.warn('[API] auth.register() is deprecated. Use Clerk\'s useSignUp() hook instead.');
    return Promise.reject(new Error('Use Clerk\'s useSignUp() hook'));
  },

  /**
   * DEPRECATED: CSRF tokens not needed with Clerk JWT
   * Kept for backward compatibility - returns dummy value
   */
  getCsrfToken: (): Promise<{ success: boolean; csrfToken: string }> => {
    console.warn('[API] CSRF tokens are not needed with Clerk authentication');
    return Promise.resolve({ success: true, csrfToken: 'not-needed-with-clerk' });
  },

  /**
   * DEPRECATED: Token refresh handled automatically by Clerk
   */
  refreshToken: (): Promise<LoginResponse> => {
    console.warn('[API] Token refresh is handled automatically by Clerk');
    return Promise.reject(new Error('Token refresh handled by Clerk'));
  },
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
// ANALYTICS API
// ============================================================================

export const analytics = {
  trackEvents: (events: unknown[]): Promise<{ success: boolean }> =>
    callMuslimEenApi('/analytics/events', {
      method: 'POST',
      body: JSON.stringify({ events }),
    }),

  getMetrics: (): Promise<{ success: boolean; metrics: unknown }> =>
    callMuslimEenApi('/analytics/metrics'),

  getFunnel: (): Promise<{ success: boolean; funnel: unknown }> =>
    callMuslimEenApi('/analytics/funnel'),
};

// ============================================================================
// FEEDBACK API
// ============================================================================

export const feedback = {
  submit: (data: { rating?: number; feedback?: string; context?: string; url?: string }): Promise<{ success: boolean; message: string }> =>
    callMuslimEenApi('/feedback', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getStats: (): Promise<{ success: boolean; stats: unknown }> =>
    callMuslimEenApi('/feedback/stats'),
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

// ============================================================================
// DEPRECATED CSRF EXPORTS (for backward compatibility)
// ============================================================================

/**
 * DEPRECATED: CSRF tokens are not needed with Clerk authentication.
 * These exports are kept for backward compatibility during migration.
 */
export const setCsrfToken = (_token: string): void => {
  // No-op: Clerk handles authentication automatically
};

export const clearCsrfToken = (): void => {
  // No-op: Clerk handles session cleanup automatically
};

export const getCsrfToken = (): string | null => {
  // Returns dummy value: Clerk handles auth via JWT
  return null;
};

export const ensureCsrfToken = async (): Promise<string | null> => {
  // Returns dummy value: Clerk handles auth via JWT
  return null;
};

// ============================================================================
// EXPORT UTILITIES
// ============================================================================

export {
  getOnlineStatus,
  initOfflineDetection,
  resetCircuitBreaker,
  registerGlobalAuthErrorHandler,
};

// Note: ApiErrorType enum, ApiError interface, and RequestOptions interface are exported at declaration
