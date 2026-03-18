/**
 * API Retry Utilities
 * Resilient network request handling
 */

import { captureError } from './sentry';

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  retryableStatuses: number[];
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  retryableStatuses: [408, 429, 500, 502, 503, 504],
};

/**
 * Calculate delay with exponential backoff
 */
const calculateDelay = (attempt: number, config: RetryConfig): number => {
  const exponentialDelay = config.baseDelay * Math.pow(2, attempt);
  const jitter = Math.random() * 1000; // Add up to 1s jitter
  return Math.min(exponentialDelay + jitter, config.maxDelay);
};

/**
 * Check if error is retryable
 */
const isRetryableError = (error: any, config: RetryConfig): boolean => {
  // Network errors (TypeError from fetch)
  if (error instanceof TypeError) {
    return true;
  }

  // HTTP status-based retry
  if (error.status && config.retryableStatuses.includes(error.status)) {
    return true;
  }

  return false;
};

/**
 * Sleep utility
 */
const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Execute function with retry logic
 */
export const withRetry = async <T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> => {
  const fullConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: any;

  for (let attempt = 0; attempt <= fullConfig.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on last attempt
      if (attempt === fullConfig.maxRetries) {
        break;
      }

      // Check if error is retryable
      if (!isRetryableError(error, fullConfig)) {
        throw error;
      }

      // Calculate delay
      const delay = calculateDelay(attempt, fullConfig);

      console.warn(`Request failed (attempt ${attempt + 1}/${fullConfig.maxRetries + 1}), retrying in ${delay}ms...`,
        error instanceof Error ? error.message : error
      );

      await sleep(delay);
    }
  }

  // All retries exhausted
  captureError(lastError instanceof Error ? lastError : new Error(String(lastError)), {
    action: 'retry_exhausted',
    maxRetries: fullConfig.maxRetries,
  });

  throw lastError;
};

/**
 * Safe fetch wrapper with retry
 */
export const safeFetch = async (
  url: string,
  options: RequestInit = {},
  config: Partial<RetryConfig> = {}
): Promise<Response> => {
  return withRetry(() => fetch(url, options), config);
};

/**
 * Check if user is online
 */
export const isOnline = (): boolean => {
  return typeof navigator !== 'undefined' && navigator.onLine;
};

/**
 * Wait for connection to come back online
 */
export const waitForConnection = (
  timeout: number = 30000
): Promise<boolean> => {
  return new Promise((resolve) => {
    if (isOnline()) {
      resolve(true);
      return;
    }

    const timeoutId = setTimeout(() => {
      cleanup();
      resolve(false);
    }, timeout);

    const handleOnline = () => {
      cleanup();
      resolve(true);
    };

    const cleanup = () => {
      clearTimeout(timeoutId);
      window.removeEventListener('online', handleOnline);
    };

    window.addEventListener('online', handleOnline);
  });
};

export default withRetry;
