# UX Improvements Guide

## Overview

This guide covers all UX improvements for the first 30 seconds of user experience.

## Quick Start

### 1. Add Toast Container to Root Layout

```tsx
// app/layout.tsx
import { ToastContainer } from '@/components/Toast';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}
```

### 2. Use LoadingButton for All Actions

```tsx
import { LoadingButton } from '@/components/LoadingButton';

<LoadingButton
  onClick={handleSubmit}
  isLoading={isLoading}
  loadingText="Saving..."
>
  Save Changes
</LoadingButton>
```

### 3. Use useForm Hook for Forms

```tsx
import { useForm } from '@/lib/useForm';

const { isSubmitting, error, handleSubmit } = useForm({
  onSubmit: async (data) => {
    await api.save(data);
  },
  successMessage: 'Saved successfully!',
  loadingMessage: 'Saving...',
});
```

### 4. Show Toast Notifications

```tsx
import { showToast } from '@/components/Toast';

showToast('Welcome back!', 'success');
showToast('Something went wrong', 'error');
showToast('Please check your input', 'warning');
showToast('Loading...', 'info');
```

---

## Components Reference

### Toast

```typescript
showToast(message: string, type?: 'success' | 'error' | 'warning' | 'info', duration?: number);
```

### LoadingButton

```typescript
<LoadingButton
  isLoading?: boolean
  loadingText?: string
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
>
```

### LoadingSpinner

```typescript
<LoadingSpinner 
  size?: 'sm' | 'md' | 'lg'
  text?: string
/>
```

### Skeleton

```typescript
<Skeleton className="h-4 w-32" />
<Skeleton circle className="h-12 w-12" />
```

---

## Error Message Improvements

### Before

```
❌ "CSRF_TOKEN_INVALID"
❌ "Request failed with status 401"
❌ "Error: undefined"
```

### After

```
✅ "Your session has expired. Please refresh the page."
✅ "Your session has expired. Please log in again."
✅ "Something went wrong. Please try again."
```

---

## Loading Message Examples

| Action | Message |
|--------|---------|
| Login | "Logging you in..." |
| Logout | "Logging you out..." |
| Register | "Creating your account..." |
| Save | "Saving your changes..." |
| Load | "Loading your dashboard..." |
| Submit | "Submitting..." |

---

## Success Message Examples

| Action | Message |
|--------|---------|
| Login | "Welcome back, [Name]!" |
| Register | "Account created successfully! Welcome to MuslimEEN." |
| Profile Update | "Profile updated successfully." |
| Invite | "Invitation sent successfully." |
| Connection | "Connection request sent." |

---

## Implementation Checklist

### Pages to Update

- [ ] Login page - Add loading state, error messages
- [ ] Register page - Add loading state, success toast
- [ ] Dashboard - Add loading screen, welcome message
- [ ] Profile - Add form loading states, save feedback
- [ ] Settings - Add loading states, success feedback

### Components to Add

- [ ] ToastContainer in root layout
- [ ] LoadingButton for all submit buttons
- [ ] Skeleton screens for data loading
- [ ] Error boundaries with friendly messages

### User Flows to Test

- [ ] First login experience
- [ ] Page refresh while logged in
- [ ] Slow network conditions
- [ ] Error scenarios (401, 500, offline)
- [ ] Form submissions (single, double-click)

---

## Testing UX

### Test 1: First Login

1. Open login page
2. Enter credentials
3. Click login
4. **Expected:** "Logging you in..." → "Welcome back, [Name]!"

### Test 2: Slow Network

1. Enable 3G throttling
2. Load dashboard
3. **Expected:** "Loading your dashboard..." with spinner

### Test 3: Error Handling

1. Enter wrong password
2. **Expected:** "Invalid email or password. Please try again."

### Test 4: Double Submission

1. Click submit button rapidly
2. **Expected:** Button disabled after first click, spinner shows

### Test 5: Success Feedback

1. Update profile
2. Save changes
3. **Expected:** "Profile updated successfully." toast appears

---

## Best Practices

1. **Always use LoadingButton** for async actions
2. **Always show feedback** after user actions
3. **Use descriptive messages** - "Logging you in..." not "Loading..."
4. **Handle all errors** with human-friendly messages
5. **Prevent double submissions** with loading states
6. **Use skeletons** for content that takes >300ms to load
7. **Personalize messages** when possible - "Welcome back, John!"

---

## Migration Guide

### From Basic Button

```tsx
// Before
<button onClick={handleSubmit} disabled={isLoading}>
  {isLoading ? 'Loading...' : 'Submit'}
</button>

// After
<LoadingButton
  onClick={handleSubmit}
  isLoading={isLoading}
  loadingText="Submitting..."
>
  Submit
</LoadingButton>
```

### From Basic Form

```tsx
// Before
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState('');

const handleSubmit = async () => {
  setIsLoading(true);
  try {
    await api.save(data);
  } catch (e) {
    setError(e.message);
  } finally {
    setIsLoading(false);
  }
};

// After
const { isSubmitting, error, handleSubmit } = useForm({
  onSubmit: async () => {
    await api.save(data);
  },
  successMessage: 'Saved!',
  loadingMessage: 'Saving...',
});
```

---

## Files Reference

| File | Purpose |
|------|---------|
| `components/Toast.tsx` | Toast notifications |
| `components/LoadingButton.tsx` | Loading buttons & spinners |
| `lib/error-messages.ts` | Human-friendly error messages |
| `lib/useForm.ts` | Form hook with UX feedback |
| `lib/ux-improvements-guide.tsx` | Usage examples |

---

## Examples

See `frontend/lib/ux-improvements-guide.tsx` for complete implementation examples.
