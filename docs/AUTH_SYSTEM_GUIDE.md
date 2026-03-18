# MuslimEEN Authentication System Guide

## Overview

This guide covers the complete authentication system implementation including session management, security, error handling, and UX patterns.

## Features

- ✅ **Secure**: httpOnly cookies, CSRF protection, XSS prevention
- ✅ **Stable**: Session sync across tabs, no UI flicker
- ✅ **Resilient**: Offline detection, retry logic, circuit breaker
- ✅ **Observable**: Sentry integration, structured logging
- ✅ **User-friendly**: Clear error messages, graceful degradation

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    AuthProvider                         │
│  - Manages auth state (user, isLoading, isInitialized)  │
│  - Cross-tab synchronization (localStorage)             │
│  - Global 401 error handling                            │
└──────────────┬──────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────┐
│                    API Client                           │
│  - Automatic CSRF token handling                        │
│  - Request timeout (30s)                                │
│  - Safe retry logic (GET only)                          │
│  - Circuit breaker (5 retries max)                      │
│  - Offline detection                                    │
└──────────────┬──────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────┐
│                 Protected Components                    │
│  - ProtectedRoute (no flash of content)                 │
│  - useApi hook (loading states, error handling)         │
│  - NetworkStatus (user feedback)                        │
└─────────────────────────────────────────────────────────┘
```

---

## Quick Start

### 1. Wrap App with AuthProvider

```tsx
// app/layout.tsx
import { AuthProvider } from '@/lib/auth-context';

export default function RootLayout({ children }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
```

### 2. Create Protected Page

```tsx
// app/dashboard/page.tsx
import { ProtectedRoute, AuthLoadingScreen } from '@/components/ProtectedRoute';

export default function DashboardPage() {
  return (
    <ProtectedRoute fallback={<AuthLoadingScreen />}>
      <DashboardContent />
    </ProtectedRoute>
  );
}
```

### 3. Create Login Page

```tsx
// app/login/page.tsx
import { PublicOnlyRoute } from '@/components/ProtectedRoute';
import { SessionExpired } from '@/components/SessionExpired';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
  const { sessionExpired, clearSessionExpired } = useAuth();

  return (
    <PublicOnlyRoute>
      <SessionExpired show={sessionExpired} onDismiss={clearSessionExpired} />
      <LoginForm />
    </PublicOnlyRoute>
  );
}
```

---

## API Client Usage

### Basic Request

```typescript
import { users } from '@/lib/api';

const response = await users.getMe();
```

### With Error Handling

```typescript
import { useApi } from '@/lib/useApi';

const { data, isLoading, error, userMessage, execute } = useApi();

const loadProfile = async () => {
  const result = await execute((signal) => users.getMe({ signal }));
  if (result) {
    // Handle success
  }
};
```

### Safe Retry (GET requests only)

```typescript
// GET requests automatically retry 2x with exponential backoff
const data = await users.getMe();

// POST requests do NOT retry (safety)
const result = await users.updateMe({ firstName: 'John' });
```

---

## Hooks Reference

### useAuth

```typescript
const {
  user,              // Current user or null
  profile,           // User profile or null
  isLoading,         // Auth operation in progress
  isAuthenticated,   // Boolean: user !== null
  isInitialized,     // Boolean: first check complete
  sessionExpired,    // Boolean: session expired flag
  login,             // (email, password) => Promise<void>
  logout,            // () => Promise<void>
  refreshUser,       // () => Promise<void>
  updateProfile,     // (updates) => Promise<void>
  clearSessionExpired, // () => void
} = useAuth();
```

### useApi

```typescript
const {
  data,           // Response data or null
  isLoading,      // Request in progress
  error,          // ApiError or null
  userMessage,    // User-friendly error message
  isRetrying,     // Auto-retry in progress
  isAutoRetry,    // Boolean: auto vs manual
  retryCount,     // Number of retries
  execute,        // (apiCall, options?) => Promise<T | null>
  reset,          // () => void
} = useApi<T>();
```

### useOnlineStatus

```typescript
const isOnline = useOnlineStatus();

// Returns navigator.onLine with event listeners
// Updates automatically when connection changes
```

---

## Component Reference

### ProtectedRoute

Prevents flash of protected content. Shows loading state until auth resolved.

```tsx
<ProtectedRoute fallback={<CustomLoader />}>
  <Dashboard />
</ProtectedRoute>
```

### PublicOnlyRoute

For login/register pages. Redirects authenticated users to dashboard.

```tsx
<PublicOnlyRoute>
  <LoginForm />
</PublicOnlyRoute>
```

### NetworkStatus

Shows loading, retry, and error states with user-friendly messages.

```tsx
<NetworkStatus
  isLoading={isLoading}
  error={error}
  userMessage={userMessage}
  isRetrying={isRetrying}
  isAutoRetry={isAutoRetry}
  retryCount={retryCount}
  isOffline={isOffline}
  onRetry={handleRetry}
>
  <Content />
</NetworkStatus>
```

### OfflineBanner

Global offline indicator. Auto-shows when connection lost.

```tsx
<OfflineBanner />
```

### SessionExpired

Shows session expiry message on login page.

```tsx
<SessionExpired show={sessionExpired} onDismiss={clearSessionExpired} />
```

---

## Error Handling

### Error Types

```typescript
enum ApiErrorType {
  TIMEOUT = 'Request is taking too long...',
  NETWORK = 'Connection issue...',
  OFFLINE = 'You are offline...',
  SERVER = 'Something went wrong on our end...',
  AUTH = 'Your session has expired...',
  CSRF = 'Security token expired...',
  VALIDATION = 'Please check your input...',
  SYSTEM_UNAVAILABLE = 'Service temporarily unavailable...',
  ABORTED = 'Request was cancelled...',
}
```

### Handling Specific Errors

```typescript
const { error } = useApi();

if (error?.type === ApiErrorType.AUTH) {
  // Session expired - handled automatically
}

if (error?.type === ApiErrorType.OFFLINE) {
  // Show offline UI
}

if (error?.retryable) {
  // Show retry button
}
```

---

## Multi-Tab Synchronization

Logout in one tab automatically logs out all other tabs:

```
Tab 1: Click Logout
  ↓
Broadcast logout event via localStorage
  ↓
Tab 2: Receive event → Auto logout
Tab 3: Receive event → Auto logout
```

Session expiry is also synchronized across tabs.

---

## Security Considerations

### CSRF Protection

- CSRF token stored in memory (NOT localStorage)
- Automatically included in mutating requests
- Refreshed on page load if missing
- Singleton pattern prevents duplicate fetches

### Session Management

- JWT stored in httpOnly cookie (XSS protection)
- 24-hour expiry
- Server-side invalidation on logout
- Automatic redirect on expiry

### XSS Prevention

- No sensitive data in localStorage
- User context cleared on logout
- Sentry filters sensitive fields

---

## Testing

### Test Multi-Tab Logout

1. Login in Tab A
2. Open same page in Tab B
3. Logout in Tab A
4. Both tabs should logout instantly

### Test Session Expiry

1. Login
2. Clear cookies in DevTools
3. Refresh page
4. Should redirect to login with expired message

### Test Offline Mode

1. Turn off network
2. Try to load data
3. Should show offline banner immediately
4. No request sent to server

### Test Circuit Breaker

1. Block API requests in DevTools
2. Try 6+ requests rapidly
3. After 5th failure, should show "Service unavailable"

---

## Configuration

### Environment Variables

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

### Timeout Configuration

```typescript
// lib/api.ts
const REQUEST_TIMEOUT = 30000; // 30 seconds
const SAFE_RETRY_CONFIG = {
  maxRetries: 2,
  baseDelay: 1000,
  maxDelay: 5000,
};
const MAX_TOTAL_RETRIES = 5; // Circuit breaker
```

---

## Troubleshooting

### Issue: Flash of protected content

**Solution**: Use `ProtectedRoute` with `isInitialized` check.

### Issue: Multiple tabs not syncing

**Solution**: Check localStorage events are not blocked by browser extensions.

### Issue: Infinite redirect loops

**Solution**: Check `hasRedirectedRef` is preventing duplicates.

### Issue: CSRF errors on every request

**Solution**: Ensure `/auth/csrf-token` endpoint is accessible.

---

## Migration Guide

### From localStorage JWT

1. Remove JWT from localStorage
2. Switch to httpOnly cookies (backend)
3. Use `useAuth()` instead of reading localStorage
4. Add `ProtectedRoute` to protected pages

### From Basic Auth

1. Add CSRF token handling
2. Implement `initOfflineDetection()`
3. Add `NetworkStatus` components
4. Implement `SessionExpired` handling

---

## Best Practices

1. **Always use ProtectedRoute** for authenticated pages
2. **Always pass signal** to API calls in useEffect
3. **Always check isInitialized** before conditional UI
4. **Never store tokens** in localStorage
5. **Always handle loading states** for better UX

---

## Files Reference

| File | Purpose |
|------|---------|
| `lib/auth-context.tsx` | Auth state management |
| `lib/api.ts` | API client with CSRF, retry, offline |
| `lib/useApi.ts` | Hook for API calls with UI state |
| `components/ProtectedRoute.tsx` | Route protection, no flash |
| `components/NetworkStatus.tsx` | Loading/error UI |
| `components/SessionExpired.tsx` | Session expiry message |

---

## Support

For issues or questions, check:
1. Browser console for errors
2. Sentry for production errors
3. Network tab for failed requests
4. Application tab for localStorage events
