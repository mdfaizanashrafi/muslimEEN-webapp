'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth, profile as profileApi, User, Profile } from './api';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch profile function
  const fetchProfile = useCallback(async () => {
    try {
      const response = await profileApi.getCurrentProfile();
      setProfile(response.profile);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  }, []);

  // Check for existing session on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('muslimeen_token');
      if (token) {
        try {
          // Get current user from /auth/me
          const userResponse = await auth.getCurrentUser();
          if (userResponse.success && userResponse.data) {
            setUser(userResponse.data);
          }
          // Get full profile
          await fetchProfile();
        } catch (error) {
          console.error('Failed to restore session:', error);
          // Clear invalid session
          localStorage.removeItem('muslimeen_token');
          localStorage.removeItem('muslimeen_csrf');
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [fetchProfile]);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await auth.login(email, password);
      
      // Store tokens
      localStorage.setItem('muslimeen_token', response.token);
      localStorage.setItem('muslimeen_csrf', response.csrfToken);
      
      // Set user
      setUser(response.user);
      
      // Fetch profile
      await fetchProfile();
    } finally {
      setIsLoading(false);
    }
  }, [fetchProfile]);

  const refreshUser = useCallback(async () => {
    try {
      // Get current user from /auth/me
      const userResponse = await auth.getCurrentUser();
      if (userResponse.success && userResponse.data) {
        setUser(userResponse.data);
      }
      
      // Get full profile
      await fetchProfile();
    } catch (error) {
      console.error('Failed to refresh user:', error);
      throw error;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await auth.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local state regardless of API response
      localStorage.removeItem('muslimeen_token');
      localStorage.removeItem('muslimeen_csrf');
      setUser(null);
      setProfile(null);
      setIsLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    const response = await profileApi.updateProfile(updates);
    setProfile(response.profile);
  }, []);

  const value: AuthContextType = {
    user,
    profile,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUser,
    updateProfile,
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
