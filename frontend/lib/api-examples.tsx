/**
 * API Usage Examples
 * Demonstrates proper error handling and user feedback
 */

import { useApi, useApiWithRetry } from './useApi';
import { NetworkStatus, InlineLoading } from '@/components/NetworkStatus';
import { users, connections, type Connection } from './api';

// ============================================================================
// EXAMPLE 1: Basic API Call with Error Handling
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
  const { data: response, isLoading, error, userMessage, execute } = useApi<UserProfileResponse>();
  const profile = response?.profile;

  const loadProfile = async () => {
    await execute(() => users.getMe());
  };

  return (
    <div className="p-4">
      <button
        onClick={loadProfile}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
      >
        {isLoading ? <InlineLoading text="Loading..." /> : 'Load Profile'}
      </button>

      <NetworkStatus
        isLoading={isLoading}
        error={error}
        userMessage={userMessage}
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
// EXAMPLE 2: API Call with Automatic Retry Feedback
// ============================================================================

export function ConnectionsListExample() {
  const {
    data: connectionsList,
    isLoading,
    error,
    userMessage,
    execute,
    isRetrying,
    retryCount,
  } = useApiWithRetry<Connection[]>();

  const loadConnections = async () => {
    await execute(() => connections.getConnections());
  };

  return (
    <div className="p-4">
      <NetworkStatus
        isLoading={isLoading}
        error={error}
        userMessage={userMessage}
        isRetrying={isRetrying}
        retryCount={retryCount}
        onRetry={loadConnections}
      >
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Connections</h2>
            <button
              onClick={loadConnections}
              className="text-sm text-blue-600 hover:underline"
            >
              Refresh
            </button>
          </div>
          
          {connectionsList?.map(conn => (
            <div key={conn.id} className="p-3 border-b">
              {conn.fullName}
            </div>
          ))}
        </div>
      </NetworkStatus>
    </div>
  );
}

// ============================================================================
// EXAMPLE 3: Form Submission with Error Handling
// ============================================================================

import { useState } from 'react';

export function UpdateProfileFormExample() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  
  const {
    isLoading,
    error,
    userMessage,
    execute,
    reset,
  } = useApi();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    reset();
    
    const result = await execute(() => users.updateMe({ firstName, lastName }));
    
    if (result) {
      // Show success toast or notification
      alert('Profile updated successfully!');
    } else {
      // Error is already handled by userMessage
      console.error('Update failed');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 max-w-md">
      {userMessage && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
          {userMessage}
        </div>
      )}
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">First Name</label>
        <input
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          disabled={isLoading}
        />
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Last Name</label>
        <input
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          disabled={isLoading}
        />
      </div>
      
      <button
        type="submit"
        disabled={isLoading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
      >
        {isLoading ? <InlineLoading text="Saving..." /> : 'Save Changes'}
      </button>
    </form>
  );
}

// ============================================================================
// EXAMPLE 4: Handling Specific Error Types
// ============================================================================

import { ApiErrorType } from './api';

export function AuthAwareComponentExample() {
  const { data, error, execute } = useApi();

  const handleAction = async () => {
    await execute(async () => {
      // Some API call
      return { success: true };
    });
  };

  // Handle specific error types
  if (error?.type === ApiErrorType.AUTH) {
    return (
      <div className="p-4">
        <p className="text-red-600">Your session has expired.</p>
        <a href="/login" className="text-blue-600 underline">
          Please log in again
        </a>
      </div>
    );
  }

  if (error?.type === ApiErrorType.NETWORK) {
    return (
      <div className="p-4">
        <p className="text-orange-600">Connection issue detected.</p>
        <button 
          onClick={handleAction}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      {data ? (
        <div>Content loaded</div>
      ) : (
        <button onClick={handleAction}>Load Data</button>
      )}
    </div>
  );
}

// ============================================================================
// EXAMPLE 5: Multiple Parallel Requests
// ============================================================================

export function DashboardExample() {
  const profileApi = useApi();
  const connectionsApi = useApi();
  const statsApi = useApi();

  const loadDashboard = async () => {
    // Load all data in parallel
    await Promise.all([
      profileApi.execute(() => users.getMe()),
      connectionsApi.execute(() => connections.getConnections()),
      statsApi.execute(() => users.getTrustScore()),
    ]);
  };

  const isAnyLoading = profileApi.isLoading || connectionsApi.isLoading || statsApi.isLoading;
  const hasAnyError = profileApi.error || connectionsApi.error || statsApi.error;

  return (
    <div className="p-4">
      {isAnyLoading && <div className="text-gray-500">Loading dashboard...</div>}
      
      {hasAnyError && (
        <div className="bg-red-50 p-4 rounded mb-4">
          <p className="text-red-700">
            {profileApi.userMessage || 
             connectionsApi.userMessage || 
             statsApi.userMessage}
          </p>
          <button
            onClick={loadDashboard}
            className="mt-2 text-sm text-blue-600 underline"
          >
            Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded shadow">
          <h3 className="font-medium">Profile</h3>
          {profileApi.data !== null && <span className="text-green-600">✓ Loaded</span>}
        </div>
        <div className="p-4 bg-white rounded shadow">
          <h3 className="font-medium">Connections</h3>
          {connectionsApi.data !== null && <span className="text-green-600">✓ Loaded</span>}
        </div>
        <div className="p-4 bg-white rounded shadow">
          <h3 className="font-medium">Trust Score</h3>
          {statsApi.data !== null && <span className="text-green-600">✓ Loaded</span>}
        </div>
      </div>
    </div>
  );
}
