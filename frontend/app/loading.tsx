'use client';

import { useEffect, useState } from 'react';

/**
 * Global Loading Component with timeout protection
 * Prevents infinite loading states
 */
export default function Loading() {
  const [showError, setShowError] = useState(false);
  const [showSlowWarning, setShowSlowWarning] = useState(false);

  useEffect(() => {
    // Show "slow connection" warning after 5 seconds
    const slowTimer = setTimeout(() => {
      setShowSlowWarning(true);
    }, 5000);

    // Show error after 15 seconds (Clerk should load within this time)
    const errorTimer = setTimeout(() => {
      setShowError(true);
    }, 15000);

    return () => {
      clearTimeout(slowTimer);
      clearTimeout(errorTimer);
    };
  }, []);

  if (showError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-4">
            <svg 
              className="mx-auto h-12 w-12 text-red-500" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Unable to Load Application
          </h2>
          <p className="text-gray-600 mb-4">
            We&apos;re having trouble loading the authentication system. 
            This may be due to a network issue or browser security settings.
          </p>
          <div className="space-y-2">
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Reload Page
            </button>
            <button
              onClick={() => {
                // Clear any cached state
                localStorage.clear();
                window.location.reload();
              }}
              className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Clear Cache & Reload
            </button>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            If the problem persists, try disabling browser extensions or using a different browser.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        <p className="text-gray-600 text-sm">
          {showSlowWarning ? 'Still loading... (slow connection)' : 'Loading...'}
        </p>
        {showSlowWarning && (
          <p className="text-xs text-gray-400 max-w-xs text-center">
            This is taking longer than usual. Please check your internet connection.
          </p>
        )}
      </div>
    </div>
  );
}
