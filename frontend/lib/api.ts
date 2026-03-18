// MuslimEEN API Client - Production Ready
// SECURITY: Uses httpOnly cookies for auth, memory-stored CSRF tokens
// HARDENED: Race-condition safe, retry-safe, production observable
// BATTLE-TESTED: Retry storm protection, offline detection, cleanup

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
// CSRF TOKEN MANAGEMENT - HARDENED
// ============================================================================

/**
 * CSRF Token State
 * SECURITY: Token stored in memory only (XSS protection)
 */
let csrfTokenMemory: string | null = null;

/**
 * Singleton promise to prevent duplicate CSRF fetch requests
 * CRITICAL: Prevents race conditions when multiple requests need CSRF
 */
let csrfFetchPromise: Promise<string | null> | null = null;

/**
 * Get CSRF token from memory
 */
const getCsrfToken = (): string | null => csrfTokenMemory;

/**
 * Set CSRF token in memory
 */
const setCsrfToken = (token: string): void => {
  csrfTokenMemory = token;
};

/**
 * Clear CSRF token from memory
 */
const clearCsrfToken = (): void => {
  csrfTokenMemory = null;
};

/**
 * Fetch CSRF token from server with singleton pattern
 * CRITICAL FIX: Prevents duplicate network calls when multiple requests
 * trigger CSRF fetch simultaneously
 */
async function fetchCsrfTokenFromServer(): Promise<string | null> {
  // If a fetch is already in progress, reuse it
  if (csrfFetchPromise) {
    return csrfFetchPromise;
  }

  // Create new fetch promise
  csrfFetchPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/csrf-token`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`CSRF fetch failed: ${response.status}`);
      }

      const data = await response.json();
      if (data.csrfToken) {
        setCsrfToken(data.csrfToken);
        return data.csrfToken;
      }
      return null;
    } catch (error) {
      // Log to Sentry for production observability
      if (typeof window !== 'undefined') {
        const { captureError, addBreadcrumb } = require('./sentry');
        captureError(error as Error, {
          component: 'csrf',
          action: 'fetch_token',
          endpoint: '/auth/csrf-token',
        });
        addBreadcrumb('CSRF token fetch failed', 'csrf', 'error');
      }
      throw error;
    } finally {
      // Reset promise after completion (success or failure)
      csrfFetchPromise = null;
    }
  })();

  return csrfFetchPromise;
}

/**
 * Ensure CSRF token is available for mutating requests
 * Fetches from server if missing (handles refresh/new tab scenarios)
 * Uses singleton pattern to prevent duplicate fetches
 */
async function ensureCsrfToken(): Promise<string | null> {
  // Check if we already have a token
  const existingToken = getCsrfToken();
  if (existingToken) return existingToken;

  // Token missing - fetch from server (singleton prevents duplicates)
  try {
    return await fetchCsrfTokenFromServer();
  } catch (e) {
    // Log structured warning
    if (typeof window !== 'undefined') {
      console.warn('[CSRF] Token fetch failed:', e);
    }
    return null;
  }
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

// CSRF error codes that trigger safe retry
const CSRF_ERROR_CODES = ['CSRF_TOKEN_INVALID', 'CSRF_TOKEN_MISSING'];

// Track CSRF retry metrics for observability
interface CsrfMetrics {
  retryAttempts: number;
  retrySuccesses: number;
  retryFailures: number;
}

const csrfMetrics: CsrfMetrics = {
  retryAttempts: 0,
  retrySuccesses: 0,
  retryFailures: 0,
};

/**
 * Log CSRF metrics (for debugging and monitoring)
 */
function logCsrfMetrics(): void {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.debug('[CSRF Metrics]', { ...csrfMetrics });
  }
}

// ============================================================================
// GLOBAL AUTH ERROR HANDLER
// ============================================================================

/**
 * Global auth error handler - set by auth-context
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
  CSRF = 'CSRF',
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
      else if (httpResponse.status === 403 && CSRF_ERROR_CODES.includes(errorData.error?.code)) {
        errorType = ApiErrorType.CSRF;
      }
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
 * Make API request with hardened CSRF token handling and safe retry logic
 * SECURITY: Automatically includes CSRF token for mutating requests
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
  const isMutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
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

  // Add CSRF token for mutating requests
  if (isMutating) {
    const csrfToken = await ensureCsrfToken();
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }
  }

  let csrfRetryCount = 0;
  const maxCsrfRetries = 1;
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
      credentials: 'include',
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

    // Handle CSRF errors with immediate retry (only for mutating requests)
    if (error.type === ApiErrorType.CSRF && isMutating && csrfRetryCount < maxCsrfRetries) {
      csrfRetryCount++;
      csrfMetrics.retryAttempts++;
      incrementGlobalRetry();

      if (typeof window !== 'undefined') {
        const { addBreadcrumb } = require('./sentry');
        addBreadcrumb(`CSRF retry ${csrfRetryCount}/${maxCsrfRetries}`, 'csrf', 'warning');
      }

      clearCsrfToken();
      try {
        const newToken = await fetchCsrfTokenFromServer();
        if (newToken) {
          headers['X-CSRF-Token'] = newToken;
          csrfMetrics.retrySuccesses++;
          continue;
        }
      } catch {
        csrfMetrics.retryFailures++;
      }
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
    // Note: ABORTED errors are already filtered out above
    if (typeof window !== 'undefined') {
      const { captureError } = require('./sentry');
      captureError(error, {
        endpoint,
        method,
        errorType: error.type,
        csrfRetries: csrfRetryCount,
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
  validateInvitation: (invitationCode: string): Promise<ValidateInvitationResponse> =>
    callMuslimEenApi('/auth/validate-invitation', {
      method: 'POST',
      body: JSON.stringify({ invitationCode }),
    }),

  /**
   * Login user
   * SECURITY: Server sets httpOnly cookie, response includes CSRF token
   */
  login: (email: string, password: string): Promise<LoginResponse> =>
    callMuslimEenApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  /**
   * Register new user
   * SECURITY: Server sets httpOnly cookie, response includes CSRF token
   */
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

  /**
   * Logout user
   * SECURITY: Server clears httpOnly cookie
   */
  logout: (): Promise<ApiResponse> =>
    callMuslimEenApi('/auth/logout', {
      method: 'POST',
    }),

  /**
   * Get current user
   * Cookie is sent automatically with credentials: 'include'
   */
  getCurrentUser: (): Promise<ApiResponse<{ user: User }>> =>
    callMuslimEenApi('/auth/me'),

  /**
   * Get fresh CSRF token from server
   * Call this when CSRF token is missing or after page refresh
   */
  getCsrfToken: (): Promise<{ success: boolean; csrfToken: string }> =>
    callMuslimEenApi('/auth/csrf-token'),

  /**
   * Refresh access token before expiration
   */
  refreshToken: (): Promise<LoginResponse> =>
    callMuslimEenApi('/auth/refresh', {
      method: 'POST',
    }),
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
// EXPORT CSRF UTILITIES FOR AUTH CONTEXT
// ============================================================================

export {
  getCsrfToken,
  setCsrfToken,
  clearCsrfToken,
  ensureCsrfToken,
  csrfMetrics,
  createApiError,
  getOnlineStatus,
  initOfflineDetection,
  resetCircuitBreaker,
  registerGlobalAuthErrorHandler,
};

// Note: ApiErrorType enum, ApiError interface, and RequestOptions interface are exported at declaration
