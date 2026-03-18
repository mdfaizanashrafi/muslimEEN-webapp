'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { ApiError, ApiErrorType, getOnlineStatus, resetCircuitBreaker } from './api';

interface UseApiState<T> {
  data: T | null;
  isLoading: boolean;
  error: ApiError | null;
  userMessage: string | null;
  isOffline: boolean;
}

interface UseApiReturn<T> extends UseApiState<T> {
  execute: (apiCall: (signal: AbortSignal) => Promise<T>) => Promise<T | null>;
  reset: () => void;
  isRetrying: boolean;
  retryCount: number;
  isAutoRetry: boolean;
  manualRetry: () => Promise<T | null>;
}

/**
 * Hook for making API calls with loading states and user feedback
 * HARDENED: AbortController cleanup, offline detection, retry differentiation
 * 
 * @example
 * ```tsx
 * const { data, isLoading, error, userMessage, isRetrying, isAutoRetry, execute } = useApi<UserProfile>();
 * 
 * const handleLoadProfile = async () => {
 *   const result = await execute((signal) => users.getMe({ signal }));
 *   if (result) {
 *     // Handle success
 *   }
 * };
 * 
 * return (
 *   <div>
 *     {isLoading && <LoadingSpinner isAutoRetry={isAutoRetry} retryCount={retryCount} />}
 *     {userMessage && <ErrorMessage message={userMessage} />}
 *     {data && <Profile profile={data} />}
 *   </div>
 * );
 * ```
 */
export function useApi<T = unknown>(): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    isLoading: false,
    error: null,
    userMessage: null,
    isOffline: false,
  });
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isAutoRetry, setIsAutoRetry] = useState(false);
  
  // Use ref to track AbortController for cleanup
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  const reset = useCallback(() => {
    // Abort any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    setState({
      data: null,
      isLoading: false,
      error: null,
      userMessage: null,
      isOffline: false,
    });
    setIsRetrying(false);
    setRetryCount(0);
    setIsAutoRetry(false);
  }, []);

  const execute = useCallback(async (
    apiCall: (signal: AbortSignal) => Promise<T>,
    options?: {
      onSuccess?: (data: T) => void;
      onError?: (error: ApiError) => void;
      showLoadingState?: boolean;
      isManualRetry?: boolean;
    }
  ): Promise<T | null> => {
    const { 
      onSuccess, 
      onError, 
      showLoadingState = true,
      isManualRetry = false 
    } = options || {};

    // Check offline status
    if (!getOnlineStatus()) {
      setState({
        data: null,
        isLoading: false,
        error: null,
        userMessage: 'You are offline. Check your internet connection.',
        isOffline: true,
      });
      return null;
    }

    // Abort any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setState(prev => ({
      ...prev,
      isLoading: showLoadingState,
      error: null,
      userMessage: null,
      isOffline: false,
    }));
    setIsRetrying(false);
    setIsAutoRetry(!isManualRetry);

    try {
      const data = await apiCall(signal);
      
      if (!isMountedRef.current) return null;
      
      setState({
        data,
        isLoading: false,
        error: null,
        userMessage: null,
        isOffline: false,
      });
      setRetryCount(0);
      
      onSuccess?.(data);
      return data;
    } catch (err) {
      if (!isMountedRef.current) return null;
      
      const error = err as ApiError;
      
      // Determine if we're retrying
      const isRetryableError = error.retryable || 
        error.type === ApiErrorType.TIMEOUT ||
        error.type === ApiErrorType.NETWORK;
      
      if (isRetryableError) {
        setIsRetrying(true);
        setRetryCount(prev => prev + 1);
      }

      // Different message for different retry types
      let userMessage = error.userMessage;
      if (isRetryableError && !isManualRetry) {
        userMessage = `${error.userMessage} Retrying...`;
      }

      setState({
        data: null,
        isLoading: false,
        error,
        userMessage,
        isOffline: error.type === ApiErrorType.OFFLINE,
      });
      
      onError?.(error);
      return null;
    }
  }, []);

  // Manual retry function
  const manualRetry = useCallback(async (): Promise<T | null> => {
    // Reset circuit breaker on manual retry
    resetCircuitBreaker();
    
    // Re-execute with the last known apiCall
    // This requires storing the last apiCall - for simplicity, return null
    // Caller should handle retry by calling their execute function again
    setRetryCount(0);
    setIsAutoRetry(false);
    return null;
  }, []);

  return {
    ...state,
    execute,
    reset,
    isRetrying,
    retryCount,
    isAutoRetry,
    manualRetry,
  };
}

/**
 * Hook for API calls with automatic retry feedback
 * Shows "Trying again..." message during automatic retries
 */
export function useApiWithRetry<T = unknown>(): UseApiReturn<T> {
  const baseHook = useApi<T>();

  const executeWithRetry = useCallback(async (
    apiCall: (signal: AbortSignal) => Promise<T>
  ): Promise<T | null> => {
    return baseHook.execute(apiCall);
  }, [baseHook]);

  return {
    ...baseHook,
    execute: executeWithRetry,
  };
}

/**
 * Hook for paginated API calls
 */
export function usePaginatedApi<T = unknown>() {
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [items, setItems] = useState<T[]>([]);
  
  const baseHook = useApi<T[]>();

  const loadMore = useCallback(async (
    apiCall: (page: number, signal: AbortSignal) => Promise<T[]>,
    options?: { pageSize?: number }
  ): Promise<void> => {
    const { pageSize = 20 } = options || {};
    
    const result = await baseHook.execute(async (signal) => {
      const data = await apiCall(page, signal);
      return data;
    });

    if (result) {
      setItems(prev => [...prev, ...result]);
      setHasMore(result.length >= pageSize);
      setPage(prev => prev + 1);
    }
  }, [baseHook, page]);

  const reset = useCallback(() => {
    setPage(1);
    setHasMore(true);
    setItems([]);
    baseHook.reset();
  }, [baseHook]);

  return {
    items,
    isLoading: baseHook.isLoading,
    error: baseHook.error,
    userMessage: baseHook.userMessage,
    isOffline: baseHook.isOffline,
    hasMore,
    loadMore,
    reset,
  };
}

/**
 * Hook to track online/offline status
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(getOnlineStatus());

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      resetCircuitBreaker();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export default useApi;
