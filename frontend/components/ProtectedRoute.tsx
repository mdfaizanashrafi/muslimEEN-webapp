'use client';

import React from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAuth?: boolean;
}

/**
 * ProtectedRoute Component - CLERK VERSION
 * Prevents flash of protected content by waiting for auth initialization
 * 
 * MIGRATED: From custom AuthContext to Clerk's useAuth hook
 * DATE: 2026-03-20
 * 
 * @example
 * ```tsx
 * // Dashboard page
 * export default function DashboardPage() {
 *   return (
 *     <ProtectedRoute>
 *       <DashboardContent />
 *     </ProtectedRoute>
 *   );
 * }
 * ```
 */
export function ProtectedRoute({ 
  children, 
  fallback,
  requireAuth = true 
}: ProtectedRouteProps) {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Store current path for redirect after login
  useEffect(() => {
    if (typeof window !== 'undefined' && pathname && pathname !== '/login') {
      sessionStorage.setItem('redirectAfterLogin', pathname);
    }
  }, [pathname]);

  // Redirect if not authenticated (after initialization)
  useEffect(() => {
    if (isLoaded && !isSignedIn && requireAuth) {
      router.push('/login');
    }
  }, [isLoaded, isSignedIn, requireAuth, router]);

  // Show loading state while initializing
  if (!isLoaded) {
    return (
      <>
        {fallback || (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="text-gray-600 text-sm">Loading...</p>
            </div>
          </div>
        )}
      </>
    );
  }

  // Return null if not authenticated (will redirect)
  if (!isSignedIn && requireAuth) {
    return null;
  }

  // Render protected content
  return <>{children}</>;
}

/**
 * PublicOnlyRoute - For login/register pages
 * Redirects authenticated users away
 */
export function PublicOnlyRoute({ 
  children,
  fallback
}: Omit<ProtectedRouteProps, 'requireAuth'>) {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      // Redirect to dashboard or stored path
      const redirectTo = sessionStorage.getItem('redirectAfterLogin') || '/dashboard';
      sessionStorage.removeItem('redirectAfterLogin');
      router.push(redirectTo);
    }
  }, [isLoaded, isSignedIn, router]);

  // Show loading state while initializing
  if (!isLoaded) {
    return (
      <>
        {fallback || (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}
      </>
    );
  }

  // Return null if authenticated (will redirect)
  if (isSignedIn) {
    return null;
  }

  // Render public content
  return <>{children}</>;
}

/**
 * AuthGuard Hook - For programmatic auth checks
 * 
 * MIGRATED: Uses Clerk's useAuth hook
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isAuthenticated, isLoading, AuthGuard } = useAuthGuard();
 *   
 *   if (!AuthGuard) return <Loading />;
 *   
 *   return <div>Protected content</div>;
 * }
 * ```
 */
export function useAuthGuard() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  // Returns false if still loading or not authenticated
  const AuthGuard = isLoaded && isSignedIn;

  // Redirect helper
  const redirectToLogin = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
    }
    router.push('/login');
  };

  return {
    isAuthenticated: isSignedIn,
    isLoading: !isLoaded,
    isInitialized: isLoaded,
    AuthGuard,
    redirectToLogin,
  };
}

/**
 * Loading Screen Component
 * Consistent loading state across the app
 */
export function AuthLoadingScreen({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-gray-600 text-sm">{message}</p>
      </div>
    </div>
  );
}

export default ProtectedRoute;
