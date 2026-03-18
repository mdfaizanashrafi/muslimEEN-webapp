/**
 * Form Hook with Loading States and UX Feedback
 */

import { useState, useCallback } from 'react';
import { showToast } from '@/components/Toast';
import { getErrorMessage, successMessages, loadingMessages } from './error-messages';
import type { ApiError } from './api';

interface UseFormOptions<T> {
  onSubmit: (data: T) => Promise<void>;
  onSuccess?: () => void;
  successMessage?: string;
  loadingMessage?: string;
  validate?: (data: T) => string | null;
}

interface UseFormReturn<T> {
  isSubmitting: boolean;
  error: string | null;
  handleSubmit: (data: T) => Promise<boolean>;
  clearError: () => void;
}

/**
 * Form hook with built-in loading states and toast feedback
 * 
 * @example
 * ```tsx
 * const { isSubmitting, error, handleSubmit } = useForm({
 *   onSubmit: async (data) => {
 *     await users.updateMe(data);
 *   },
 *   onSuccess: () => {
 *     router.push('/profile');
 *   },
 *   successMessage: 'Profile updated!',
 *   loadingMessage: 'Saving changes...',
 * });
 * ```
 */
export function useForm<T>(options: UseFormOptions<T>): UseFormReturn<T> {
  const {
    onSubmit,
    onSuccess,
    successMessage,
    loadingMessage = loadingMessages.formSubmitting,
    validate,
  } = options;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async (data: T): Promise<boolean> => {
    // Validate
    if (validate) {
      const validationError = validate(data);
      if (validationError) {
        setError(validationError);
        return false;
      }
    }

    setIsSubmitting(true);
    setError(null);

    // Show loading toast for long operations
    const toastId = setTimeout(() => {
      showToast(loadingMessage, 'info', 3000);
    }, 500);

    try {
      await onSubmit(data);
      
      clearTimeout(toastId);
      
      // Show success message
      if (successMessage) {
        showToast(successMessage, 'success');
      }
      
      onSuccess?.();
      return true;
    } catch (err) {
      clearTimeout(toastId);
      
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      
      // Show error toast
      showToast(errorMessage, 'error');
      
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [onSubmit, onSuccess, successMessage, loadingMessage, validate]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isSubmitting,
    error,
    handleSubmit,
    clearError,
  };
}

/**
 * Hook for login form with specific UX
 */
export function useLoginForm(options: {
  onSubmit: (email: string, password: string) => Promise<void>;
  onSuccess?: () => void;
  getUserName?: () => string | undefined;
}) {
  const { onSubmit, onSuccess, getUserName } = options;

  return useForm({
    onSubmit: async ({ email, password }: { email: string; password: string }) => {
      await onSubmit(email, password);
    },
    onSuccess,
    successMessage: successMessages.login(getUserName?.()),
    loadingMessage: loadingMessages.login,
    validate: ({ email, password }) => {
      if (!email) return 'Please enter your email address';
      if (!password) return 'Please enter your password';
      if (!email.includes('@')) return 'Please enter a valid email address';
      return null;
    },
  });
}

/**
 * Hook for registration form
 */
export function useRegisterForm(options: {
  onSubmit: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    invitationCode: string;
  }) => Promise<void>;
  onSuccess?: () => void;
}) {
  const { onSubmit, onSuccess } = options;

  return useForm({
    onSubmit,
    onSuccess,
    successMessage: successMessages.register,
    loadingMessage: loadingMessages.register,
    validate: (data) => {
      if (!data.email) return 'Please enter your email address';
      if (!data.password) return 'Please enter a password';
      if (data.password.length < 8) return 'Password must be at least 8 characters';
      if (!data.firstName) return 'Please enter your first name';
      if (!data.lastName) return 'Please enter your last name';
      if (!data.invitationCode) return 'Please enter your invitation code';
      return null;
    },
  });
}

/**
 * Hook for profile update form
 */
export function useProfileForm(options: {
  onSubmit: (updates: Partial<{ firstName: string; lastName: string; bio: string }>) => Promise<void>;
  onSuccess?: () => void;
}) {
  const { onSubmit, onSuccess } = options;

  return useForm({
    onSubmit,
    onSuccess,
    successMessage: successMessages.profileUpdate,
    loadingMessage: loadingMessages.profileUpdate,
  });
}

export default useForm;
