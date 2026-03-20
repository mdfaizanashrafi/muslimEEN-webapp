/**
 * Internal API Client
 * 
 * Client for making authenticated internal service-to-service calls.
 * Automatically adds x-internal-api-key header.
 * 
 * USAGE:
 *   import { internalApiClient } from './client';
 *   
 *   const stats = await internalApiClient.get('/stats');
 *   await internalApiClient.post('/cache/clear', {});
 * 
 * DATE: 2026-03-20
 */

import { env } from '../../config/env';
import { logger } from '../shared/utils/logger';

// ============================================================================
// CONFIGURATION
// ============================================================================

const INTERNAL_API_BASE_URL = env.INTERNAL_API_URL || 'http://localhost:3001/api/internal';
const INTERNAL_API_KEY = env.INTERNAL_API_KEY;

// ============================================================================
// TYPES
// ============================================================================

interface InternalApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

interface RequestOptions {
  timeout?: number;
  retries?: number;
}

// ============================================================================
// CLIENT
// ============================================================================

class InternalApiClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  /**
   * Make authenticated internal API request
   */
  private async request<T>(
    method: string,
    endpoint: string,
    body?: any,
    options: RequestOptions = {}
  ): Promise<InternalApiResponse<T>> {
    const { timeout = 30000, retries = 3 } = options;
    
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-internal-api-key': this.apiKey,
    };

    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        const response = await fetch(url, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorData: any = await response.json().catch(() => ({}));
          throw new Error(
            errorData?.error?.message || `HTTP ${response.status}: ${response.statusText}`
          );
        }
        
        const data = await response.json();
        return data as InternalApiResponse<T>;
        
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < retries) {
          logger.warn(`Internal API request failed (attempt ${attempt}), retrying...`, {
            endpoint,
            error: lastError.message,
          });
          
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }
    
    logger.error('Internal API request failed after retries', {
      endpoint,
      error: lastError?.message,
    });
    
    throw lastError || new Error('Request failed');
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, options?: RequestOptions): Promise<InternalApiResponse<T>> {
    return this.request<T>('GET', endpoint, undefined, options);
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, body: any, options?: RequestOptions): Promise<InternalApiResponse<T>> {
    return this.request<T>('POST', endpoint, body, options);
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, body: any, options?: RequestOptions): Promise<InternalApiResponse<T>> {
    return this.request<T>('PUT', endpoint, body, options);
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, body: any, options?: RequestOptions): Promise<InternalApiResponse<T>> {
    return this.request<T>('PATCH', endpoint, body, options);
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, options?: RequestOptions): Promise<InternalApiResponse<T>> {
    return this.request<T>('DELETE', endpoint, undefined, options);
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

/**
 * Validate environment on startup
 */
const validateConfig = (): void => {
  if (!INTERNAL_API_KEY) {
    logger.warn('INTERNAL_API_KEY not set. Internal API calls will fail.');
  }
};

validateConfig();

/**
 * Singleton client instance
 */
export const internalApiClient = new InternalApiClient(
  INTERNAL_API_BASE_URL,
  INTERNAL_API_KEY || ''
);

/**
 * Create a new client with specific config
 */
export const createInternalClient = (baseUrl: string, apiKey: string): InternalApiClient => {
  return new InternalApiClient(baseUrl, apiKey);
};

export default internalApiClient;
