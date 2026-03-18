/**
 * UX Improvements Guide
 * Better loading states, error messages, and feedback
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from './auth-context';
import { useForm, useLoginForm } from './useForm';
import { LoadingButton, LoadingSpinner, Skeleton } from '@/components/LoadingButton';
import { showToast } from '@/components/Toast';
import { successMessages, getErrorMessage } from './error-messages';
import { useApi } from './useApi';
import { users } from './api';

// ============================================================================
// EXAMPLE 1: Improved Login Form
// ============================================================================

export function ImprovedLoginForm() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { isSubmitting, error, handleSubmit, clearError } = useLoginForm({
    onSubmit: async (email, password) => {
      await login(email, password);
    },
    onSuccess: () => {
      // Toast shown automatically: "Welcome back!"
    },
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    await handleSubmit({ email, password });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold text-center">Welcome Back</h1>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email Address
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="you@example.com"
          disabled={isSubmitting}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="••••••••"
          disabled={isSubmitting}
          required
        />
      </div>

      <LoadingButton
        type="submit"
        isLoading={isSubmitting}
        loadingText="Logging you in..."
        variant="primary"
        fullWidth
      >
        Log In
      </LoadingButton>

      <p className="text-center text-sm text-gray-600">
        Don't have an account?{' '}
        <a href="/register" className="text-blue-600 hover:underline">
          Request an invite
        </a>
      </p>
    </form>
  );
}

// ============================================================================
// EXAMPLE 2: Improved Dashboard Loading
// ============================================================================

export function ImprovedDashboard() {
  const { user } = useAuth();
  const { data: profile, isLoading, error, userMessage, execute } = useApi();

  useEffect(() => {
    execute(() => users.getMe());
  }, [execute]);

  // Show loading state with message
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <LoadingSpinner size="lg" text="Loading your dashboard..." />
        <p className="mt-4 text-gray-500 text-sm">
          This may take a few seconds
        </p>
      </div>
    );
  }

  // Show error with retry
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Couldn't Load Dashboard
          </h2>
          <p className="text-gray-600 mb-6">{userMessage}</p>
          <LoadingButton
            onClick={() => execute(() => users.getMe())}
            variant="primary"
          >
            Try Again
          </LoadingButton>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-2">
        Welcome back, {user?.firstName}!
      </h1>
      <p className="text-gray-600">Here's what's happening today.</p>
      
      {profile !== null && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Connections" value={0} />
          <StatCard title="Invites Remaining" value={user?.invitesRemaining || 0} />
          <StatCard title="Trust Score" value={user?.trustScore || 0} />
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <p className="text-sm text-gray-600">{title}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  );
}

// ============================================================================
// EXAMPLE 3: Improved Profile Update with Toast
// ============================================================================

export function ImprovedProfileForm() {
  const { user } = useAuth();
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');

  const { isSubmitting, error, handleSubmit, clearError } = useForm({
    onSubmit: async () => {
      await users.updateMe({ firstName, lastName });
    },
    successMessage: 'Your profile has been updated successfully!',
    loadingMessage: 'Saving your changes...',
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    const success = await handleSubmit({});
    
    if (success) {
      // Additional success actions
      console.log('Profile saved');
    }
  };

  return (
    <form onSubmit={onSubmit} className="max-w-lg mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit Profile</h1>
        <p className="text-gray-600 text-sm mt-1">
          Update your personal information
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            First Name
          </label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Last Name
          </label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="flex gap-4 pt-4">
        <LoadingButton
          type="submit"
          isLoading={isSubmitting}
          loadingText="Saving..."
          variant="primary"
        >
          Save Changes
        </LoadingButton>
        
        <button
          type="button"
          onClick={() => {
            setFirstName(user?.firstName || '');
            setLastName(user?.lastName || '');
            showToast('Changes discarded', 'info');
          }}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
          disabled={isSubmitting}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ============================================================================
// EXAMPLE 4: Manual Toast Usage
// ============================================================================

export function ToastExamples() {
  const { logout } = useAuth();

  const handleLogout = async () => {
    // Show loading toast
    showToast('Logging you out...', 'info', 2000);
    
    await logout();
    
    // Success toast shown automatically by auth-context
    // But we can add additional feedback
    showToast('You have been logged out successfully', 'success');
  };

  const handleInvite = async () => {
    try {
      showToast('Sending invitation...', 'info', 2000);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      showToast('Invitation sent successfully!', 'success');
    } catch (error) {
      showToast(getErrorMessage(error), 'error');
    }
  };

  return (
    <div className="p-8 space-y-4">
      <h2 className="text-xl font-bold">Toast Examples</h2>
      
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => showToast('Welcome back, John!', 'success')}
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          Success Toast
        </button>
        
        <button
          onClick={() => showToast('Something went wrong', 'error')}
          className="px-4 py-2 bg-red-600 text-white rounded"
        >
          Error Toast
        </button>
        
        <button
          onClick={() => showToast('Please check your input', 'warning')}
          className="px-4 py-2 bg-yellow-600 text-white rounded"
        >
          Warning Toast
        </button>
        
        <button
          onClick={() => showToast('Loading your data...', 'info')}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Info Toast
        </button>
        
        <button
          onClick={handleInvite}
          className="px-4 py-2 bg-purple-600 text-white rounded"
        >
          Async Action
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// EXAMPLE 5: Skeleton Loading States
// ============================================================================

export function SkeletonExample() {
  const { isLoading } = useApi();

  if (isLoading) {
    return (
      <div className="p-8 space-y-6 max-w-2xl">
        {/* Header skeleton */}
        <div className="flex items-center gap-4">
          <Skeleton circle className="h-16 w-16" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        
        {/* Content skeleton */}
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        
        {/* Stats skeleton */}
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
        </div>
      </div>
    );
  }

  return <div>Content loaded</div>;
}

// ============================================================================
// EXAMPLE 6: First 30 Seconds Experience
// ============================================================================

export function First30SecondsExperience() {
  const { isLoading, isInitialized, isAuthenticated, user } = useAuth();

  // Phase 1: Initial load (0-2 seconds)
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
            <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-2 border-blue-200 opacity-20"></div>
          </div>
          <p className="mt-6 text-lg font-medium text-gray-700">
            MuslimEEN
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Preparing your experience...
          </p>
        </div>
      </div>
    );
  }

  // Phase 2: Auth check complete (2-5 seconds)
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Checking your session..." />
      </div>
    );
  }

  // Phase 3: Welcome (5+ seconds)
  if (isAuthenticated) {
    return (
      <div className="min-h-screen p-8">
        <h1 className="text-3xl font-bold">
          Welcome back, {user?.firstName}! 👋
        </h1>
        <p className="text-gray-600 mt-2">
          Here's your personalized dashboard for today.
        </p>
      </div>
    );
  }

  // Not authenticated
  return <ImprovedLoginForm />;
}

// ============================================================================
// KEY IMPROVEMENTS SUMMARY
// ============================================================================

/**
 * 1. LOADING STATES
 *    - Every async action shows loading state
 *    - Descriptive messages: "Logging you in..."
 *    - Loading buttons prevent double submission
 *    - Skeleton screens for content loading
 * 
 * 2. SUCCESS FEEDBACK
 *    - Toast notifications for all actions
 *    - Personalized messages: "Welcome back, John!"
 *    - Auto-dismiss after 5 seconds
 *    - Stacking support for multiple toasts
 * 
 * 3. ERROR MESSAGES
 *    - Technical errors translated to human language
 *    - Action-oriented: "Please try again"
 *    - Context-specific messages
 *    - Visual distinction (colors, icons)
 * 
 * 4. PREVENT DOUBLE ACTIONS
 *    - Buttons disabled during submission
 *    - Loading spinners on buttons
 *    - Form validation before submission
 *    - Clear visual feedback
 * 
 * 5. FIRST 30 SECONDS
 *    - Branded loading screen
 *    - Progress indication
 *    - Welcome message with name
 *    - Smooth transitions
 */

