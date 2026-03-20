'use client';

/**
 * AuthProviderWrapper - CLERK COMPATIBILITY LAYER
 * 
 * MIGRATED: This component is now a pass-through since ClerkProvider 
 * is at the root level in layout.tsx
 * 
 * DATE: 2026-03-20
 * 
 * Kept for backward compatibility during migration.
 * Can be removed once all imports are updated.
 */

import { AuthProvider } from '@/lib/auth-context';

export function AuthProviderWrapper({ children }: { children: React.ReactNode }) {
  // AuthProvider is now a compatibility layer that uses Clerk internally
  return <AuthProvider>{children}</AuthProvider>;
}
