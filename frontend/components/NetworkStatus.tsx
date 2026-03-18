'use client';

import React, { useState, useEffect } from 'react';
import { ApiError, ApiErrorType } from '@/lib/api';

interface NetworkStatusProps {
  isLoading: boolean;
  error: ApiError | null;
  userMessage: string | null;
  isRetrying?: boolean;
  isAutoRetry?: boolean;
  retryCount?: number;
  isOffline?: boolean;
  onRetry?: () => void;
  children: React.ReactNode;
}

/**
 * Network Status Component
 * Shows loading states, errors, retry feedback, and offline status
 * 
 * @example
 * ```tsx
 * <NetworkStatus
 *   isLoading={isLoading}
 *   error={error}
 *   userMessage={userMessage}
 *   isRetrying={isRetrying}
 *   isAutoRetry={isAutoRetry}
 *   retryCount={retryCount}
 *   isOffline={isOffline}
 *   onRetry={handleRetry}
 * >
 *   <UserProfile data={data} />
 * </NetworkStatus>
 * ```
 */
export function NetworkStatus({
  isLoading,
  error,
  userMessage,
  isRetrying = false,
  isAutoRetry = false,
  retryCount = 0,
  isOffline = false,
  onRetry,
  children,
}: NetworkStatusProps) {
  const [showLoading, setShowLoading] = useState(false);
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);

  // Delay showing loading state to prevent flicker for fast requests
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => setShowLoading(true), 300);
      return () => clearTimeout(timer);
    } else {
      setShowLoading(false);
    }
  }, [isLoading]);

  // Show offline banner with delay
  useEffect(() => {
    if (isOffline) {
      setShowOfflineBanner(true);
    } else {
      // Keep banner briefly when coming back online
      const timer = setTimeout(() => setShowOfflineBanner(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isOffline]);

  // Don't render loading state immediately for fast requests
  if (isLoading && !showLoading) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {/* Offline Banner */}
      {showOfflineBanner && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-white px-4 py-2 text-center text-sm font-medium animate-in slide-in-from-top">
          <span className="inline-flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {isOffline 
              ? 'You are offline. Check your internet connection.'
              : 'Back online!'
            }
          </span>
        </div>
      )}

      {showLoading ? (
        <div className="flex flex-col items-center justify-center p-8 min-h-[200px]">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            {isRetrying && (
              <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                <span className="text-sm text-gray-500">
                  {isAutoRetry 
                    ? `Trying again${retryCount > 0 ? ` (${retryCount})` : ''}...`
                    : 'Retrying...'
                  }
                </span>
              </div>
            )}
          </div>
          <p className="mt-8 text-gray-600 text-sm">
            {isRetrying 
              ? isAutoRetry 
                ? 'Connection issue. Retrying...'
                : 'Retrying connection...'
              : 'Loading...'
            }
          </p>
        </div>
      ) : error && userMessage ? (
        <div className="flex flex-col items-center justify-center p-8 min-h-[200px]">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full">
            <div className="flex items-start gap-3">
              <div className="text-red-500 mt-0.5">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-red-800 font-medium mb-1">
                  {getErrorTitle(error.type)}
                </h3>
                <p className="text-red-600 text-sm">
                  {userMessage}
                </p>
                
                {error.type === ApiErrorType.SYSTEM_UNAVAILABLE && (
                  <p className="mt-2 text-xs text-red-500">
                    Too many failed attempts. Please wait a moment before trying again.
                  </p>
                )}
                
                {isRetryable(error) && onRetry && (
                  <button
                    onClick={onRetry}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Try Again
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        children
      )}
    </div>
  );
}

function isRetryable(error: ApiError): boolean {
  return error.retryable || 
    error.type === ApiErrorType.TIMEOUT ||
    error.type === ApiErrorType.NETWORK ||
    error.type === ApiErrorType.SYSTEM_UNAVAILABLE;
}

function getErrorTitle(type: ApiErrorType): string {
  const titles: Record<ApiErrorType, string> = {
    [ApiErrorType.TIMEOUT]: 'Request Timed Out',
    [ApiErrorType.NETWORK]: 'Connection Issue',
    [ApiErrorType.OFFLINE]: 'You Are Offline',
    [ApiErrorType.SERVER]: 'Server Error',
    [ApiErrorType.AUTH]: 'Session Expired',
    [ApiErrorType.CSRF]: 'Security Error',
    [ApiErrorType.VALIDATION]: 'Validation Error',
    [ApiErrorType.SYSTEM_UNAVAILABLE]: 'Service Unavailable',
    [ApiErrorType.ABORTED]: 'Request Cancelled',
    [ApiErrorType.UNKNOWN]: 'Error',
  };
  return titles[type] || 'Error';
}

/**
 * Inline loading indicator for buttons/forms
 * Differentiates between loading and retrying states
 */
export function InlineLoading({ 
  text = 'Loading...',
  isRetrying = false,
}: { 
  text?: string;
  isRetrying?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
      {isRetrying ? 'Retrying...' : text}
    </span>
  );
}

/**
 * Offline Banner Component
 * Can be used independently at app level
 */
export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-white px-4 py-2 text-center text-sm font-medium">
      <span className="inline-flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        You are offline. Check your internet connection.
      </span>
    </div>
  );
}

/**
 * Toast notification for network errors
 */
export function NetworkToast({
  message,
  type = 'error',
  onClose,
}: {
  message: string;
  type?: 'error' | 'warning' | 'info' | 'success';
  onClose?: () => void;
}) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose?.(), 300);
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!isVisible) return null;

  const styles = {
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
  };

  return (
    <div className={`fixed bottom-4 right-4 p-4 rounded-lg border shadow-lg max-w-sm animate-in slide-in-from-bottom-2 ${styles[type]}`}>
      <div className="flex items-start gap-3">
        <p className="text-sm">{message}</p>
        {onClose && (
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(() => onClose(), 300);
            }}
            className="text-current opacity-50 hover:opacity-100"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export default NetworkStatus;
