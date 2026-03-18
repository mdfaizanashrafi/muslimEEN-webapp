/**
 * Auth Final Implementation Guide
 * 
 * Features:
 * - Cross-tab session synchronization
 * - No flash of protected content
 * - Consistent initialization state
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProtectedRoute, AuthLoadingScreen, PublicOnlyRoute, useAuthGuard } from '@/components/ProtectedRoute';
import { SessionExpired } from '@/components/SessionExpired';
import { useAuth, AuthProvider } from '@/lib/auth-context';
import { useApi } from '@/lib/useApi';
import { NetworkStatus, OfflineBanner } from '@/components/NetworkStatus';
import { users } from '@/lib/api';

// ============================================================================
// EXAMPLE 1: Protected Dashboard Page
// ============================================================================

export function DashboardPageExample() {
  return (
    <ProtectedRoute fallback={<AuthLoadingScreen message="Checking authentication..." />}>
      <DashboardContent />
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const { user, logout } = useAuth();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Welcome, {user?.fullName}</h1>
      <button 
        onClick={logout}
        className="mt-4 px-4 py-2 bg-red-600 text-white rounded"
      >
        Logout
      </button>
    </div>
  );
}

// ============================================================================
// EXAMPLE 2: Login Page (Public Only)
// ============================================================================

export function LoginPageExample() {
  const { sessionExpired, clearSessionExpired } = useAuth();
  const searchParams = useSearchParams();
  const isExpired = searchParams.get('expired') === 'true';

  return (
    <PublicOnlyRoute>
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <h1 className="text-2xl font-bold text-center mb-6">Log In</h1>
          
          {/* Show session expired message */}
          <SessionExpired 
            show={sessionExpired || isExpired} 
            onDismiss={clearSessionExpired}
          />
          
          <LoginForm />
        </div>
      </div>
    </PublicOnlyRoute>
  );
}

function LoginForm() {
  // ... login form implementation
  return <form>{/* ... */}</form>;
}

// ============================================================================
// EXAMPLE 3: Using AuthGuard Hook for Conditional UI
// ============================================================================

export function NavbarExample() {
  const { isAuthenticated, isInitialized, AuthGuard } = useAuthGuard();

  // Don't render auth-dependent UI until initialized
  if (!isInitialized) {
    return (
      <nav className="p-4 bg-white shadow">
        <div className="h-8 bg-gray-200 rounded animate-pulse w-32"></div>
      </nav>
    );
  }

  return (
    <nav className="p-4 bg-white shadow flex justify-between">
      <div>Logo</div>
      
      {AuthGuard ? (
        <UserMenu />
      ) : (
        <a href="/login" className="text-blue-600">Log In</a>
      )}
    </nav>
  );
}

function UserMenu() {
  const { user, logout } = useAuth();

  return (
    <div className="flex items-center gap-4">
      <span>{user?.fullName}</span>
      <button onClick={logout} className="text-red-600">
        Logout
      </button>
    </div>
  );
}

// ============================================================================
// EXAMPLE 4: Multi-Tab Logout Test
// ============================================================================

export function MultiTabTest() {
  const { user, logout, isAuthenticated } = useAuth();
  const [tabId] = useState(() => Math.random().toString(36).substr(2, 9));

  useEffect(() => {
    console.log(`[Tab ${tabId}] Auth state:`, { isAuthenticated, user: user?.email });
  }, [isAuthenticated, user, tabId]);

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold">Tab ID: {tabId}</h1>
      <p className="mt-2">Status: {isAuthenticated ? 'Authenticated' : 'Not authenticated'}</p>
      
      {isAuthenticated && (
        <button 
          onClick={logout}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded"
        >
          Logout (All tabs will logout)
        </button>
      )}
      
      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h2 className="font-medium">Instructions:</h2>
        <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
          <li>Open this page in 2+ tabs</li>
          <li>Login in one tab</li>
          <li>Click logout in any tab</li>
          <li>All tabs should logout simultaneously</li>
        </ol>
      </div>
    </div>
  );
}

// ============================================================================
// EXAMPLE 5: Slow Network Initialization Test
// ============================================================================

export function SlowNetworkTest() {
  const { isLoading, isInitialized, isAuthenticated, user } = useAuth();

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold mb-4">Initialization State</h1>
      
      <div className="space-y-2 font-mono text-sm">
        <div className="flex gap-4">
          <span className="w-32">isLoading:</span>
          <span className={isLoading ? 'text-yellow-600' : 'text-green-600'}>
            {isLoading.toString()}
          </span>
        </div>
        <div className="flex gap-4">
          <span className="w-32">isInitialized:</span>
          <span className={isInitialized ? 'text-green-600' : 'text-yellow-600'}>
            {isInitialized.toString()}
          </span>
        </div>
        <div className="flex gap-4">
          <span className="w-32">isAuthenticated:</span>
          <span className={isAuthenticated ? 'text-green-600' : 'text-red-600'}>
            {isAuthenticated.toString()}
          </span>
        </div>
        <div className="flex gap-4">
          <span className="w-32">user:</span>
          <span>{user?.email || 'null'}</span>
        </div>
      </div>
      
      <div className="mt-8 p-4 bg-blue-50 rounded">
        <h2 className="font-medium text-blue-800">Expected Behavior:</h2>
        <ul className="list-disc list-inside mt-2 text-sm text-blue-700 space-y-1">
          <li>isLoading starts as true</li>
          <li>After auth check, isLoading becomes false</li>
          <li>isInitialized becomes true after first check</li>
          <li>User state is always consistent</li>
        </ul>
      </div>
    </div>
  );
}

// ============================================================================
// EXAMPLE 6: Protected API Call Pattern
// ============================================================================

export function ProtectedDataFetch() {
  const { isAuthenticated, isInitialized } = useAuth();
  const { 
    data: profile, 
    isLoading, 
    error, 
    userMessage, 
    execute 
  } = useApi();

  // Only fetch if authenticated
  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      execute(() => users.getMe());
    }
  }, [isInitialized, isAuthenticated, execute]);

  // Show loading while auth initializes
  if (!isInitialized) {
    return <AuthLoadingScreen message="Initializing..." />;
  }

  // Show loading while fetching data
  return (
    <NetworkStatus
      isLoading={isLoading}
      error={error}
      userMessage={userMessage}
    >
      <div className="p-4">
        <h2 className="text-xl font-bold">Profile</h2>
        <pre className="mt-4 p-4 bg-gray-100 rounded">
          {JSON.stringify(profile, null, 2)}
        </pre>
      </div>
    </NetworkStatus>
  );
}

// ============================================================================
// EXAMPLE 7: App-Level Setup
// ============================================================================

export function AppExample({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <OfflineBanner /> {/* Global offline indicator */}
      <AppContent>
        {children}
      </AppContent>
    </AuthProvider>
  );
}

function AppContent({ children }: { children: React.ReactNode }) {
  const { isInitialized } = useAuth();

  // Show global loading until auth initializes
  if (!isInitialized) {
    return <AuthLoadingScreen />;
  }

  return <>{children}</>;
}

// ============================================================================
// KEY BEHAVIORS SUMMARY
// ============================================================================

/**
 * 1. MULTI-TAB SYNC
 *    - Logout broadcasts to all tabs via localStorage
 *    - Session expiry broadcasts to all tabs
 *    - All tabs update simultaneously
 *    - No duplicate redirects (processing flag)
 * 
 * 2. NO FLASH OF PROTECTED CONTENT
 *    - isLoading starts as true
 *    - ProtectedRoute shows fallback until auth check completes
 *    - No redirect until isLoading is false
 * 
 * 3. CONSISTENT INITIALIZATION
 *    - isInitialized starts as false
 *    - Becomes true after first auth check (success or fail)
 *    - UI can rely on isInitialized for skeleton states
 * 
 * 4. CLEANUP
 *    - All event listeners removed on unmount
 *    - No memory leaks
 *    - No state updates after unmount
 */

// Default export for compatibility
export default DashboardPageExample;
