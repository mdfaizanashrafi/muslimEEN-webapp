'use client';

import React from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAuth?: boolean;
}

/**
 * ProtectedRoute Component
 * Prevents flash of protected content by waiting for auth initialization
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
 * 
 * @example
 * ```tsx
 * // Custom loading state
 * <ProtectedRoute fallback={<CustomLoader />}>
 *   <Dashboard />
 * </ProtectedRoute>
 * ```
 */
export function ProtectedRoute({ 
  children, 
  fallback,
  requireAuth = true 
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, isInitialized } = useAuth();
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
    if (isInitialized && !isLoading && !isAuthenticated && requireAuth) {
      router.push('/login');
    }
  }, [isInitialized, isLoading, isAuthenticated, requireAuth, router]);

  // Show loading state while initializing
  if (!isInitialized || isLoading) {
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
  if (!isAuthenticated && requireAuth) {
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
  const { isAuthenticated, isLoading, isInitialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isInitialized && !isLoading && isAuthenticated) {
      // Redirect to dashboard or stored path
      const redirectTo = sessionStorage.getItem('redirectAfterLogin') || '/dashboard';
      sessionStorage.removeItem('redirectAfterLogin');
      router.push(redirectTo);
    }
  }, [isInitialized, isLoading, isAuthenticated, router]);

  // Show loading state while initializing
  if (!isInitialized || isLoading) {
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
  if (isAuthenticated) {
    return null;
  }

  // Render public content
  return <>{children}</>;
}

/**
 * AuthGuard Hook - For programmatic auth checks
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
  const { isAuthenticated, isLoading, isInitialized } = useAuth();
  const router = useRouter();

  // Returns false if still loading or not authenticated
  const AuthGuard = isInitialized && !isLoading && isAuthenticated;

  // Redirect helper
  const redirectToLogin = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
    }
    router.push('/login');
  };

  return {
    isAuthenticated,
    isLoading,
    isInitialized,
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
