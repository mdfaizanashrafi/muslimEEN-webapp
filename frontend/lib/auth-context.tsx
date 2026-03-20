/**
 * Auth Context - CLERK COMPATIBILITY LAYER
 * 
 * MIGRATED: This file now re-exports Clerk hooks for backward compatibility
 * DATE: 2026-03-20
 * 
 * This allows existing components to continue using `useAuth` from '@/lib/auth-context'
 * while internally using Clerk's authentication system.
 * 
 * DEPRECATION NOTICE: Consider migrating components to use Clerk hooks directly:
 *   import { useAuth, useUser } from '@clerk/nextjs';
 */

'use client';

import { 
  useAuth as useClerkAuth, 
  useUser as useClerkUser,
  useSession 
} from '@clerk/nextjs';
import { useCallback, useEffect, useState } from 'react';
import { users } from './api';

// Re-export CSRF utilities (now no-ops for backward compatibility)
export { setCsrfToken, clearCsrfToken, ensureCsrfToken } from './api';

// Types for backward compatibility
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  trustScore: number;
  verificationTier: 'basic' | 'verified' | 'business' | 'institutional';
  role: string;
  isActive: boolean;
  invitesRemaining: number;
}

export interface Profile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  bio?: string;
  location?: string;
  industry?: string;
  skills: string[];
  endorsements: number;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isInitialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  sessionExpired: boolean;
  clearSessionExpired: () => void;
}

/**
 * useAuth Hook - Backward Compatible Version
 * 
 * MIGRATED: Now uses Clerk internally while maintaining the same API
 * 
 * @deprecated Migrate to Clerk's hooks: import { useAuth, useUser } from '@clerk/nextjs'
 */
export function useAuth(): AuthContextType {
  const { isSignedIn, isLoaded, userId } = useClerkAuth();
  const { user: clerkUser, isLoaded: isUserLoaded } = useClerkUser();
  const { session } = useSession();
  
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  // Fetch user data from API when Clerk auth is ready
  useEffect(() => {
    if (!isLoaded || !isUserLoaded) {
      return;
    }

    if (!isSignedIn || !userId) {
      setUser(null);
      setProfile(null);
      setIsLoading(false);
      return;
    }

    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        
        // Get user data from backend
        const userResponse = await users.getMe();
        if (userResponse.success && userResponse.profile) {
          const profileData = userResponse.profile;
          
          // Map to User type
          setUser({
            id: userId,
            email: clerkUser?.primaryEmailAddress?.emailAddress || profileData.email,
            firstName: profileData.firstName,
            lastName: profileData.lastName,
            fullName: profileData.fullName,
            trustScore: 0, // Will be fetched separately
            verificationTier: 'basic',
            role: 'muslim_unverified',
            isActive: true,
            invitesRemaining: 0,
          });
          
          setProfile(profileData);
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        setUser(null);
        setProfile(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [isLoaded, isUserLoaded, isSignedIn, userId, clerkUser]);

  /**
   * DEPRECATED: Login is now handled by Clerk's SignIn component
   * This method is kept for API compatibility but will throw an error
   */
  const login = useCallback(async (_email: string, _password: string) => {
    console.warn(
      '[DEPRECATED] useAuth().login() is no longer supported. ' +
      'Use Clerk\'s SignIn component or useSignIn() hook instead.'
    );
    throw new Error(
      'Direct login via useAuth is deprecated. Use Clerk\'s SignIn component.'
    );
  }, []);

  /**
   * Logout - Uses Clerk's signOut method
   */
  const logout = useCallback(async () => {
    try {
      // Call backend logout for cleanup
      await fetch('/api/auth/logout', { method: 'POST' });
      
      // Sign out from Clerk
      await session?.end();
      
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [session]);

  /**
   * Refresh user data
   */
  const refreshUser = useCallback(async () => {
    if (!isSignedIn || !userId) return;
    
    try {
      setIsLoading(true);
      const userResponse = await users.getMe();
      if (userResponse.success && userResponse.profile) {
        const profileData = userResponse.profile;
        setUser(prev => prev ? { ...prev, ...profileData } : null);
        setProfile(profileData);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, userId]);

  /**
   * Update user profile
   */
  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    try {
      const response = await users.updateMe(updates);
      if (response.success && response.profile) {
        setProfile(response.profile);
        setUser(prev => prev ? { ...prev, ...response.profile } : null);
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  }, []);

  /**
   * Clear session expired flag
   */
  const clearSessionExpired = useCallback(() => {
    setSessionExpired(false);
  }, []);

  return {
    user,
    profile,
    isLoading: !isLoaded || !isUserLoaded || isLoading,
    isAuthenticated: !!isSignedIn,
    isInitialized: isLoaded && isUserLoaded,
    login,
    logout,
    refreshUser,
    updateProfile,
    sessionExpired,
    clearSessionExpired,
  };
}

/**
 * AuthProvider - No longer needed with Clerk
 * 
 * MIGRATED: ClerkProvider in layout.tsx handles authentication state
 * This is a no-op wrapper for backward compatibility
 * 
 * @deprecated Remove this wrapper - ClerkProvider is in layout.tsx
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // ClerkProvider is now at the root level in layout.tsx
  return <>{children}</>;
}

// Default export for backward compatibility
export default AuthProvider;
