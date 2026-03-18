'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { auth, users, setCsrfToken, clearCsrfToken, ensureCsrfToken, ApiErrorType, registerGlobalAuthErrorHandler, type ApiError } from './api';
import { initSentry, setUserContext, clearUserContext, captureError, addBreadcrumb } from './sentry';

// Initialize Sentry on module load
if (typeof window !== 'undefined') {
  initSentry();
}

// ============================================================================
// CROSS-TAB AUTH SYNCHRONIZATION
// ============================================================================

const AUTH_STORAGE_KEY = 'meen_auth_event';

interface AuthStorageEvent {
  type: 'LOGIN' | 'LOGOUT' | 'SESSION_EXPIRED';
  timestamp: number;
  user?: { id: string; email: string };
}

/**
 * Broadcast auth event to other tabs
 */
function broadcastAuthEvent(event: AuthStorageEvent): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(event));
    // Immediately remove to allow future events with same timestamp
    setTimeout(() => {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }, 100);
  } catch (e) {
    console.debug('Failed to broadcast auth event:', e);
  }
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

interface User {
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

interface Profile {
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Re-export for backward compatibility
export { setCsrfToken, clearCsrfToken } from './api';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  
  // Track if we've already redirected to prevent loops
  const hasRedirectedRef = useRef(false);
  // Track if we're currently processing a storage event
  const processingStorageEvent = useRef(false);

  // Fetch profile function
  const fetchProfile = useCallback(async () => {
    try {
      const response = await users.getMe();
      setProfile(response.profile);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  }, []);

  /**
   * Handle session expiry
   * Clears auth state and shows session expired message
   */
  const handleSessionExpired = useCallback((error: ApiError) => {
    // Prevent multiple redirects
    if (hasRedirectedRef.current) return;
    hasRedirectedRef.current = true;

    // Clear auth state
    clearCsrfToken();
    clearUserContext();
    setUser(null);
    setProfile(null);
    setSessionExpired(true);

    // Log to Sentry
    captureError(error, {
      component: 'auth',
      action: 'session_expired',
    });
    addBreadcrumb('Session expired, user logged out', 'auth', 'warning');

    // Broadcast to other tabs
    broadcastAuthEvent({
      type: 'SESSION_EXPIRED',
      timestamp: Date.now(),
    });

    // Redirect to login if not already there
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
      // Store current path for redirect back after login
      const currentPath = window.location.pathname + window.location.search;
      if (currentPath !== '/login') {
        sessionStorage.setItem('redirectAfterLogin', currentPath);
      }
      
      router.push('/login?expired=true');
    }
  }, [router]);

  /**
   * Clear session expired flag
   * Called after user acknowledges the message
   */
  const clearSessionExpired = useCallback(() => {
    setSessionExpired(false);
    hasRedirectedRef.current = false;
  }, []);

  /**
   * Perform logout - shared logic for both user-initiated and cross-tab
   */
  const performLogout = useCallback(async (skipServerLogout = false) => {
    if (processingStorageEvent.current) return;
    processingStorageEvent.current = true;

    try {
      if (!skipServerLogout) {
        // Call server logout (best effort)
        await auth.logout().catch(() => {
          // Ignore server errors during logout
        });
      }
    } finally {
      // Clear client state
      clearCsrfToken();
      clearUserContext();
      setUser(null);
      setProfile(null);
      setSessionExpired(false);
      hasRedirectedRef.current = false;
      processingStorageEvent.current = false;
      
      addBreadcrumb('User logged out', 'auth');
      
      // Only redirect if not already on login page
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        router.push('/login');
      }
    }
  }, [router]);

  // Register global auth error handler
  useEffect(() => {
    registerGlobalAuthErrorHandler(handleSessionExpired);
    return () => {
      registerGlobalAuthErrorHandler(() => {});
    };
  }, [handleSessionExpired]);

  // Cross-tab synchronization
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== AUTH_STORAGE_KEY || !event.newValue) return;
      
      // Prevent duplicate processing
      if (processingStorageEvent.current) return;

      try {
        const data: AuthStorageEvent = JSON.parse(event.newValue);
        
        // Ignore old events (older than 5 seconds)
        if (Date.now() - data.timestamp > 5000) return;

        switch (data.type) {
          case 'LOGOUT':
            addBreadcrumb('Cross-tab logout received', 'auth');
            performLogout(true); // Skip server logout (already done in other tab)
            break;
            
          case 'SESSION_EXPIRED':
            addBreadcrumb('Cross-tab session expiry received', 'auth');
            setSessionExpired(true);
            hasRedirectedRef.current = true;
            setUser(null);
            setProfile(null);
            clearCsrfToken();
            clearUserContext();
            
            // Redirect if not on login page
            if (!window.location.pathname.includes('/login')) {
              router.push('/login?expired=true');
            }
            break;
            
          case 'LOGIN':
            // Optional: Auto-login other tabs
            // For security, we typically don't auto-login other tabs
            // Instead, show a message that user logged in elsewhere
            addBreadcrumb('Cross-tab login detected', 'auth');
            break;
        }
      } catch (e) {
        console.debug('Failed to process auth storage event:', e);
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [performLogout, router]);

  // Initialize auth state on mount
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        // Try to get current user - cookie will be sent automatically
        const userResponse = await auth.getCurrentUser();
        
        if (!isMounted) return;
        
        if (userResponse.success && userResponse.data?.user) {
          const user = userResponse.data.user;
          setUser(user);
          
          // CRITICAL: Ensure CSRF token is available
          try {
            const csrfToken = await ensureCsrfToken();
            if (csrfToken) {
              addBreadcrumb('CSRF token initialized on app load', 'auth');
            } else {
              console.warn('[Auth] CSRF token not available on init, will fetch on demand');
              addBreadcrumb('CSRF token not available on init', 'auth', 'warning');
            }
          } catch (csrfError) {
            captureError(csrfError as Error, {
              component: 'auth',
              action: 'csrf_init_failed',
            });
          }
          
          // Set Sentry user context
          setUserContext({
            id: user.id,
            email: user.email,
            role: user.role,
          });
          
          // Get full profile
          await fetchProfile();
        } else {
          // Explicitly set null for consistent state
          setUser(null);
        }
      } catch (error) {
        if (!isMounted) return;
        
        const apiError = error as ApiError;
        
        // Handle 401 on init - session expired
        if (apiError.type === ApiErrorType.AUTH) {
          handleSessionExpired(apiError);
        } else {
          // No valid session - explicitly set null
          setUser(null);
          console.debug('No valid session found');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsInitialized(true);
        }
      }
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, [fetchProfile, handleSessionExpired]);

  /**
   * Login with email and password
   * SECURITY: Token is stored in httpOnly cookie by server, NOT in JavaScript
   */
  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await auth.login(email, password);
      
      // Store CSRF token in memory (NOT localStorage - XSS protection)
      if (response.csrfToken) {
        setCsrfToken(response.csrfToken);
        addBreadcrumb('CSRF token set after login', 'auth');
      }
      
      // Set user from response
      setUser(response.user);
      
      // Clear session expired flag
      setSessionExpired(false);
      hasRedirectedRef.current = false;
      
      // Set Sentry user context for error tracking
      setUserContext({
        id: response.user.id,
        email: response.user.email,
        role: response.user.role,
      });
      
      // Fetch profile
      await fetchProfile();
      
      // Broadcast login to other tabs (optional)
      broadcastAuthEvent({
        type: 'LOGIN',
        timestamp: Date.now(),
        user: { id: response.user.id, email: response.user.email },
      });
      
      // Log success
      addBreadcrumb('User logged in successfully', 'auth');
    } catch (error) {
      captureError(error as Error, { action: 'login' });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [fetchProfile]);

  /**
   * Refresh user data from server
   */
  const refreshUser = useCallback(async () => {
    try {
      const userResponse = await auth.getCurrentUser();
      if (userResponse.success && userResponse.data?.user) {
        setUser(userResponse.data.user);
      } else {
        setUser(null);
      }
      
      // Get full profile
      await fetchProfile();
    } catch (error) {
      const apiError = error as ApiError;
      
      // Handle 401 on refresh
      if (apiError.type === ApiErrorType.AUTH) {
        handleSessionExpired(apiError);
      } else {
        console.error('Failed to refresh user:', error);
        throw error;
      }
    }
  }, [fetchProfile, handleSessionExpired]);

  /**
   * Logout user
   * SECURITY: Server clears httpOnly cookie, we clear memory state
   */
  const logout = useCallback(async () => {
    setIsLoading(true);
    
    // Broadcast logout to other tabs BEFORE server call
    broadcastAuthEvent({
      type: 'LOGOUT',
      timestamp: Date.now(),
    });
    
    // Perform local logout
    await performLogout(false);
  }, [performLogout]);

  /**
   * Update user profile
   */
  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    try {
      const response = await users.updateMe(updates);
      setProfile(response.profile);
    } catch (error) {
      const apiError = error as ApiError;
      
      // Handle 401 on update
      if (apiError.type === ApiErrorType.AUTH) {
        handleSessionExpired(apiError);
      } else {
        throw error;
      }
    }
  }, [handleSessionExpired]);

  const value: AuthContextType = {
    user,
    profile,
    isLoading,
    isAuthenticated: !!user,
    isInitialized,
    login,
    logout,
    refreshUser,
    updateProfile,
    sessionExpired,
    clearSessionExpired,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
