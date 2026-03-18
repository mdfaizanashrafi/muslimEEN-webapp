'use client';

import React from 'react';

interface SessionExpiredProps {
  show: boolean;
  onDismiss?: () => void;
}

/**
 * Session Expired Alert
 * Shows when user's session has expired and they need to log in again
 * 
 * @example
 * ```tsx
 * <SessionExpired show={sessionExpired} onDismiss={clearSessionExpired} />
 * ```
 */
export function SessionExpired({ show, onDismiss }: SessionExpiredProps) {
  if (!show) return null;

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <div className="text-yellow-600 mt-0.5">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-yellow-800 font-medium">
            Session Expired
          </h3>
          <p className="text-yellow-700 text-sm mt-1">
            Your session has expired for security reasons. Please log in again to continue.
          </p>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="mt-2 text-sm text-yellow-800 underline hover:text-yellow-900"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Login Page Session Alert
 * Reads URL parameter to show expired message
 * 
 * @example
 * ```tsx
 * // In login page
 * export default function LoginPage() {
 *   return (
 *     <div>
 *       <LoginSessionAlert />
 *       <LoginForm />
 *     </div>
 *   );
 * }
 * ```
 */
export function LoginSessionAlert() {
  // Check URL for expired parameter
  const isExpired = typeof window !== 'undefined' && 
    new URLSearchParams(window.location.search).get('expired') === 'true';

  if (!isExpired) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <div className="text-blue-600 mt-0.5">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
        <div>
          <h3 className="text-blue-800 font-medium">
            Session Expired
          </h3>
          <p className="text-blue-700 text-sm mt-1">
            Your session has expired for security reasons. Please log in again to continue.
          </p>
        </div>
      </div>
    </div>
  );
}

export default SessionExpired;
