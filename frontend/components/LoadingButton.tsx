'use client';

import React, { ButtonHTMLAttributes } from 'react';

interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

/**
 * Loading Button Component
 * Prevents double submissions and shows loading state
 * 
 * @example
 * ```tsx
 * <LoadingButton
 *   onClick={handleSubmit}
 *   isLoading={isLoading}
 *   loadingText="Saving..."
 *   variant="primary"
 * >
 *   Save Changes
 * </LoadingButton>
 * ```
 */
export function LoadingButton({
  isLoading = false,
  loadingText,
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled,
  className = '',
  ...props
}: LoadingButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 active:bg-blue-800',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500 active:bg-gray-400',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 active:bg-red-800',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-500',
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg 
            className="animate-spin h-4 w-4" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>{loadingText || children}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

/**
 * Loading Spinner Component
 * 
 * @example
 * ```tsx
 * <LoadingSpinner size="lg" text="Loading..." />
 * ```
 */
export function LoadingSpinner({ 
  size = 'md', 
  text,
  className = '' 
}: { 
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <svg 
        className={`animate-spin ${sizes[size]} text-blue-600`}
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24"
      >
        <circle 
          className="opacity-25" 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          strokeWidth="4"
        />
        <path 
          className="opacity-75" 
          fill="currentColor" 
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      {text && <p className="text-gray-600 text-sm">{text}</p>}
    </div>
  );
}

/**
 * Skeleton Loader Component
 * Shows placeholder while content loads
 * 
 * @example
 * ```tsx
 * <Skeleton className="h-4 w-32" />
 * <Skeleton circle className="h-12 w-12" />
 * ```
 */
export function Skeleton({ 
  className = '', 
  circle = false,
  style,
}: { 
  className?: string;
  circle?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <div 
      className={`
        animate-pulse bg-gray-200 
        ${circle ? 'rounded-full' : 'rounded'}
        ${className}
      `}
      style={style}
      aria-hidden="true"
    />
  );
}

/**
 * Content Loader Component
 * Multiple skeleton lines for content
 * 
 * @example
 * ```tsx
 * <ContentLoader lines={3} />
 * ```
 */
export function ContentLoader({ 
  lines = 3,
  className = '' 
}: { 
  lines?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          className="h-4 w-full" 
          style={{ width: i === lines - 1 ? '75%' : '100%' }}
        />
      ))}
    </div>
  );
}

export default LoadingButton;
