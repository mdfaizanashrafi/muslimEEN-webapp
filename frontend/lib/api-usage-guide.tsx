/**
 * API Usage Guide - Battle-Tested Network Layer
 * 
 * Features:
 * - Circuit breaker (prevents retry storms)
 * - Offline detection
 * - Request cancellation (no memory leaks)
 * - Differentiated UX messages
 * - Safe retry logic
 */

import { useState } from 'react';
import { useApi, useOnlineStatus } from '@/lib/useApi';
import { NetworkStatus, InlineLoading, OfflineBanner } from '@/components/NetworkStatus';
import { users, connections, ApiErrorType } from '@/lib/api';

// ============================================================================
// EXAMPLE 1: Basic Usage with All Features
// ============================================================================

interface UserProfileResponse {
  success: boolean;
  profile: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export function UserProfileExample() {
  const { 
    data: response, 
    isLoading, 
    error, 
    userMessage, 
    isRetrying,
    isAutoRetry,
    retryCount,
    isOffline,
    execute,
    reset 
  } = useApi<UserProfileResponse>();
  const profile = response?.profile;

  const loadProfile = async () => {
    // Pass signal for cancellation support
    await execute(() => users.getMe());
  };

  return (
    <div className="p-4">
      <button
        onClick={loadProfile}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
      >
        {isLoading ? (
          <InlineLoading 
            text="Loading..." 
            isRetrying={isRetrying} 
          />
        ) : (
          'Load Profile'
        )}
      </button>

      <NetworkStatus
        isLoading={isLoading}
        error={error}
        userMessage={userMessage}
        isRetrying={isRetrying}
        isAutoRetry={isAutoRetry}
        retryCount={retryCount}
        isOffline={isOffline}
        onRetry={loadProfile}
      >
        {profile && (
          <div className="mt-4 p-4 bg-gray-50 rounded">
            <p><strong>Name:</strong> {profile.firstName} {profile.lastName}</p>
            <p><strong>Email:</strong> {profile.email}</p>
          </div>
        )}
      </NetworkStatus>
    </div>
  );
}

// ============================================================================
// EXAMPLE 2: Global Offline Banner (App-Level)
// ============================================================================

export function AppWithOfflineDetection() {
  return (
    <div>
      {/* Shows automatically when offline */}
      <OfflineBanner />
      
      <main>
        <h1>My App</h1>
        {/* Your app content */}
      </main>
    </div>
  );
}

// ============================================================================
// EXAMPLE 3: Navigation Safety (Component Unmount)
// ============================================================================

import { useEffect } from 'react';

export function AutoLoadingComponent() {
  const { data, isLoading, execute, reset } = useApi();

  useEffect(() => {
    // Load data on mount
    execute(() => users.getMe());

    // Cleanup on unmount - automatically cancels in-flight requests
    return () => {
      reset();
    };
  }, [execute, reset]);

  if (isLoading) return <div>Loading...</div>;
  return <div>{data ? 'Loaded' : 'No data'}</div>;
}

// ============================================================================
// EXAMPLE 4: Handling Specific Error Types
// ============================================================================

export function ErrorAwareComponent() {
  const { data, error, userMessage, execute } = useApi();

  const handleAction = async () => {
    await execute(() => users.getMe());
  };

  // Circuit breaker triggered - too many retries
  if (error?.type === ApiErrorType.SYSTEM_UNAVAILABLE) {
    return (
      <div className="p-4 bg-red-50 rounded">
        <h3 className="text-red-800 font-medium">Service Unavailable</h3>
        <p className="text-red-600 text-sm mt-1">
          Too many failed attempts. Please wait a moment before trying again.
        </p>
        <button 
          onClick={handleAction}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Offline
  if (error?.type === ApiErrorType.OFFLINE) {
    return (
      <div className="p-4 bg-yellow-50 rounded">
        <h3 className="text-yellow-800 font-medium">You Are Offline</h3>
        <p className="text-yellow-600 text-sm mt-1">
          Check your internet connection and try again.
        </p>
      </div>
    );
  }

  // Timeout vs Network Error differentiation
  if (error?.type === ApiErrorType.TIMEOUT) {
    return (
      <div className="p-4 bg-orange-50 rounded">
        <h3 className="text-orange-800 font-medium">Server Slow</h3>
        <p className="text-orange-600 text-sm mt-1">
          Server is taking too long to respond. Please try again.
        </p>
        <button 
          onClick={handleAction}
          className="mt-4 px-4 py-2 bg-orange-600 text-white rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  if (error?.type === ApiErrorType.NETWORK) {
    return (
      <div className="p-4 bg-blue-50 rounded">
        <h3 className="text-blue-800 font-medium">Connection Issue</h3>
        <p className="text-blue-600 text-sm mt-1">
          No internet connection. Please check your network.
        </p>
      </div>
    );
  }

  return (
    <div>
      {data ? <div>Content loaded</div> : <button onClick={handleAction}>Load</button>}
    </div>
  );
}

// ============================================================================
// EXAMPLE 5: Manual Retry vs Auto Retry UX
// ============================================================================

export function RetryUXExample() {
  const { 
    data, 
    isLoading, 
    isRetrying, 
    isAutoRetry,
    retryCount,
    userMessage,
    execute 
  } = useApi();

  const loadData = async () => {
    await execute(() => connections.getConnections());
  };

  const manualRetry = async () => {
    await execute(() => connections.getConnections());
  };

  return (
    <div className="p-4">
      {/* Loading state shows different message for auto vs manual retry */}
      {isLoading && (
        <div className="flex items-center gap-2 text-gray-600">
          {isRetrying ? (
            <>
              <div className="animate-spin h-4 w-4 border-b-2 border-current rounded-full" />
              {isAutoRetry 
                ? `Connection issue. Trying again (${retryCount})...`
                : 'Retrying connection...'
              }
            </>
          ) : (
            <>
              <div className="animate-spin h-4 w-4 border-b-2 border-current rounded-full" />
              Loading...
            </>
          )}
        </div>
      )}

      {userMessage !== null && !isLoading && (
        <div className="bg-red-50 p-4 rounded">
          <p className="text-red-600">{userMessage as string}</p>
          <button 
            onClick={manualRetry}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded"
          >
            Try Again
          </button>
        </div>
      )}

      {data !== null && <div>Data loaded: {(data as { length: number }).length} items</div>}

      {!isLoading && !userMessage && !data && (
        <button onClick={loadData}>Load Data</button>
      )}
    </div>
  );
}

// ============================================================================
// EXAMPLE 6: Testing Retry Storm Protection
// ============================================================================

export function CircuitBreakerTest() {
  const { error, userMessage, execute } = useApi();
  const [attempts, setAttempts] = useState(0);

  const triggerFailures = async () => {
    // This will trigger multiple retries
    // After 5 global retries, circuit breaker will open
    for (let i = 0; i < 10; i++) {
      setAttempts(i + 1);
      await execute((signal) => 
        // Simulate failing request
        fetch('/api/failing-endpoint', { signal })
      );
    }
  };

  return (
    <div className="p-4">
      <button 
        onClick={triggerFailures}
        className="px-4 py-2 bg-red-600 text-white rounded"
      >
        Test Circuit Breaker (10 rapid requests)
      </button>

      <p className="mt-2 text-sm text-gray-600">
        Attempts: {attempts}
      </p>

      {error?.type === ApiErrorType.SYSTEM_UNAVAILABLE && (
        <div className="mt-4 p-4 bg-yellow-50 rounded border border-yellow-200">
          <h3 className="text-yellow-800 font-medium">✓ Circuit Breaker Working</h3>
          <p className="text-yellow-600 text-sm">
            Stopped retrying after 5 failed attempts to protect backend.
          </p>
        </div>
      )}

      {userMessage && (
        <div className="mt-4 p-4 bg-gray-50 rounded">
          <p className="text-gray-600">Message: {userMessage}</p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// KEY BEHAVIORS SUMMARY
// ============================================================================

/**
 * 1. CIRCUIT BREAKER
 *    - Tracks global retry count across all requests
 *    - Max 5 retries per session
 *    - Opens circuit → stops all retries
 *    - Manual retry resets circuit
 * 
 * 2. OFFLINE DETECTION
 *    - Checks navigator.onLine before each request
 *    - Listens to online/offline events
 *    - Shows banner when offline
 *    - Auto-hides when back online
 * 
 * 3. REQUEST CANCELLATION
 *    - AbortController per request
 *    - Auto-cancel on component unmount
 *    - Prevents memory leaks
 *    - No UI glitches from stale responses
 * 
 * 4. UX DIFFERENTIATION
 *    - Auto retry: "Trying again..."
 *    - Manual retry: "Retrying..."
 *    - Timeout: "Server is taking too long..."
 *    - Network: "No internet connection..."
 *    - Circuit open: "Service temporarily unavailable..."
 * 
 * 5. SAFE RETRY LOGIC
 *    - GET requests: 2 retries with exponential backoff
 *    - POST/PUT/DELETE: No retries (safety)
 *    - CSRF errors: 1 immediate retry
 *    - Global limit: 5 retries per session
 */
