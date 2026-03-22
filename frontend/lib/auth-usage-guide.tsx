/**
 * Auth Usage Guide - Session Stability
 * 
 * Features:
 * - Automatic session expiry detection
 * - Global 401 handling
 * - Clear user feedback
 * - Redirect after login
 */

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from './auth-context';
import { SessionExpired, LoginSessionAlert } from '@/components/SessionExpired';
import { ApiErrorType, users } from './api';

// ============================================================================
// EXAMPLE 1: Login Page with Session Expiry Handling
// ============================================================================

export function LoginPageExample() {
  const { login, isLoading, sessionExpired, clearSessionExpired } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Check if redirected due to session expiry
  const isExpired = searchParams.get('expired') === 'true';

  const handleLogin = async (email: string, password: string) => {
    try {
      await login(email, password);
      
      // Redirect to original page or dashboard
      const redirectTo = sessionStorage.getItem('redirectAfterLogin') || '/dashboard';
      sessionStorage.removeItem('redirectAfterLogin');
      router.push(redirectTo);
    } catch (error) {
      // Show login error (handled by form)
      console.error('Login failed:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6">Log In</h1>
        
        {/* Show session expired message */}
        <SessionExpired 
          show={sessionExpired || isExpired} 
          onDismiss={clearSessionExpired}
        />
        
        <LoginForm onSubmit={handleLogin} isLoading={isLoading} />
      </div>
    </div>
  );
}

// Simple login form component
function LoginForm({ 
  onSubmit, 
  isLoading 
}: { 
  onSubmit: (email: string, password: string) => Promise<void>;
  isLoading: boolean;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      await onSubmit(email, password);
    } catch (err) {
      setError('Invalid email or password');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow">
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded text-sm">
          {error}
        </div>
      )}
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full px-3 py-2 border rounded-md"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full px-3 py-2 border rounded-md"
          required
        />
      </div>
      
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading ? 'Logging in...' : 'Log In'}
      </button>
    </form>
  );
}

// ============================================================================
// EXAMPLE 2: Protected Route with Session Check
// ============================================================================

export function ProtectedPageExample() {
  const { user, isLoading, isAuthenticated, sessionExpired } = useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Welcome, {user?.fullName}</h1>
      <p className="text-gray-600 mt-2">Your session is active.</p>
      
      {sessionExpired && (
        <div className="mt-4 p-4 bg-yellow-50 rounded">
          <p className="text-yellow-800">
            Your session has expired. Please refresh the page.
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EXAMPLE 3: Component Handling 401 Errors
// ============================================================================

export function UserProfileComponent() {
  const [profile, setProfile] = useState<{ firstName: string; lastName: string; email: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { sessionExpired } = useAuth();

  const loadProfile = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await users.getMe();
      setProfile(response.profile);
    } catch (err) {
      const apiError = err as { type: ApiErrorType; userMessage: string };
      
      // 401 errors are handled globally by auth-context
      // But we can still show a local message
      if (apiError.type === ApiErrorType.AUTH) {
        setError('Your session has expired. Redirecting to login...');
        // Don't need to redirect - auth-context already does it
      } else {
        setError(apiError.userMessage || 'Failed to load profile');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4">
      <button 
        onClick={loadProfile}
        disabled={isLoading || sessionExpired}
        className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
      >
        {isLoading ? 'Loading...' : 'Load Profile'}
      </button>
      
      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {sessionExpired && (
        <div className="mt-4 p-4 bg-yellow-50 rounded">
          <p className="text-yellow-800">
            Session expired. Please <a href="/login" className="underline">log in again</a>.
          </p>
        </div>
      )}
      
      {profile && !error && (
        <div className="mt-4 p-4 bg-gray-50 rounded">
          <pre>{JSON.stringify(profile, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EXAMPLE 4: Testing Session Expiry
// ============================================================================

export function TestSessionExpiry() {
  const { logout, sessionExpired } = useAuth();
  const [testResult, setTestResult] = useState('');

  const simulateExpiredToken = async () => {
    // Clear the cookie to simulate expiry
    document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    // Try to make an authenticated request
    try {
      await users.getMe();
      setTestResult('ERROR: Request should have failed');
    } catch (err) {
      const apiError = err as { type: ApiErrorType };
      if (apiError.type === ApiErrorType.AUTH) {
        setTestResult('SUCCESS: 401 detected, redirecting to login...');
      } else {
        setTestResult(`UNEXPECTED: ${JSON.stringify(err)}`);
      }
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">Test Session Expiry</h2>
      
      <div className="space-y-2">
        <button
          onClick={simulateExpiredToken}
          className="px-4 py-2 bg-red-600 text-white rounded"
        >
          Simulate Expired Token
        </button>
        
        <button
          onClick={logout}
          className="px-4 py-2 bg-gray-600 text-white rounded ml-2"
        >
          Normal Logout
        </button>
      </div>
      
      {testResult && (
        <div className="mt-4 p-4 bg-gray-50 rounded">
          <p>{testResult}</p>
        </div>
      )}
      
      {sessionExpired && (
        <div className="mt-4 p-4 bg-green-50 rounded">
          <p className="text-green-700">
            ✓ Session expired flag is set. User should be redirected to login.
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EXAMPLE 5: Middleware for Server-Side Auth Check (Next.js)
// ============================================================================

/**
 * Example middleware to check auth server-side
 * This runs before page loads
 */
export function middlewareExample(request: { cookies: { get: (name: string) => { value?: string } | undefined }; url: string; nextUrl: { pathname: string } }) {
  const token = request.cookies.get('access_token')?.value;
  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || 
                     request.nextUrl.pathname.startsWith('/invite') ||
                     request.nextUrl.pathname.startsWith('/signup');
  
  // Redirect to login if no token and not on auth page
  if (!token && !isAuthPage) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }
  
  // Redirect to dashboard if has token and on auth page
  if (token && isAuthPage) {
    return {
      redirect: {
        destination: '/dashboard',
        permanent: false,
      },
    };
  }
  
  return null;
}

// ============================================================================
// KEY BEHAVIORS SUMMARY
// ============================================================================

/**
 * 1. SESSION EXPIRY DETECTION
 *    - API client detects 401 responses
 *    - Triggers global auth error handler
 *    - Auth context clears user state
 *    - Redirects to login with ?expired=true
 * 
 * 2. USER FEEDBACK
 *    - Login page shows "Session expired" message
 *    - Message explains security reason
 *    - Clear call to action (log in again)
 * 
 * 3. NO SILENT FAILURES
 *    - All 401s are handled
 *    - User always sees feedback
 *    - Never stuck with empty UI
 * 
 * 4. REDIRECT AFTER LOGIN
 *    - Original URL stored in sessionStorage
 *    - User redirected back after login
 *    - Smooth user experience
 * 
 * 5. PREVENTS REDIRECT LOOPS
 *    - hasRedirectedRef tracks if already redirected
 *    - Only redirects once per expiry
 *    - Safe to call multiple times
 */
