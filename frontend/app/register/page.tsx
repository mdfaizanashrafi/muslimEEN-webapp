'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useSignUp, useAuth } from '@clerk/nextjs';
import { invites } from '@/lib/api';
import '@/styles/login.css';

/**
 * Register Page - INVITE-ONLY SIGNUP
 * 
 * CRITICAL: Users CANNOT sign up without a valid invite token.
 * This is a core business requirement for MuslimEEN.
 * 
 * FLOW:
 * 1. User enters invite code
 * 2. Frontend validates invite with backend
 * 3. If valid, user proceeds to enter email/password
 * 4. Clerk creates the account
 * 5. Backend webhook marks invite as used
 * 
 * SECURITY: Backend ALWAYS re-validates the invite before allowing signup completion.
 * 
 * DATE: 2026-03-20
 */

export default function RegisterPage() {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const signUpContext = useSignUp() as any;
  
  // Invite validation state
  const [inviteCode, setInviteCode] = useState('');
  const [isInviteValid, setIsInviteValid] = useState(false);
  const [isValidatingInvite, setIsValidatingInvite] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteData, setInviteData] = useState<any>(null);
  
  // Registration form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Verification state (for email verification)
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isSignedIn) {
      router.push('/dashboard');
    }
  }, [isSignedIn, router]);

  /**
   * STEP 1: Validate Invite Code
   * 
   * CRITICAL: This is the gatekeeper. No invite = No signup.
   * Backend validation ensures the invite is:
   * - Real (exists in DB)
   * - Not used
   * - Not expired
   * - Not revoked
   */
  const validateInvite = async () => {
    // Reset states
    setInviteError('');
    setIsInviteValid(false);
    setInviteData(null);
    
    // Validate format
    if (!inviteCode || inviteCode.length < 8) {
      setInviteError('Please enter a valid invite code (at least 8 characters)');
      return;
    }

    setIsValidatingInvite(true);

    try {
      // Call backend to validate invite
      const response = await invites.validateInvite(inviteCode);
      
      if (response.success && response.valid) {
        setIsInviteValid(true);
        setInviteData(response);
        
        // If invite has pre-assigned email, use it
        if (response.email) {
          setEmail(response.email);
        }
        
        showAlert('Invite validated! You can now create your account.', 'success');
      } else {
        setInviteError(response.message || 'Invalid or expired invite code');
      }
    } catch (err: any) {
      setInviteError(err.message || 'Failed to validate invite. Please try again.');
    } finally {
      setIsValidatingInvite(false);
    }
  };

  /**
   * STEP 2: Create Account with Clerk
   * 
   * Includes the invite code in the signup data.
   * Backend webhook will verify the invite again before completing signup.
   */
  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Double-check invite is validated
    if (!isInviteValid) {
      setError('Please validate your invite code first');
      return;
    }

    // Validate inputs
    if (!email || !password || !firstName || !lastName) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (!signUpContext.isLoaded) {
      setError('Authentication system is loading. Please try again.');
      return;
    }

    setIsLoading(true);

    try {
      // Create the signup with Clerk
      // Include invite code in the metadata for backend verification
      const result = await signUpContext.signUp?.create({
        emailAddress: email,
        password,
        firstName,
        lastName,
        unsafeMetadata: {
          inviteCode: inviteCode.toUpperCase(), // Pass invite code to backend
          source: 'invite_only_signup',
        },
      });

      if (result?.status === 'complete') {
        // Signup complete - set session and redirect
        await signUpContext.setActive({ session: result.createdSessionId });
        router.push('/dashboard');
      } else if (result?.status === 'missing_requirements') {
        // Email verification required
        setPendingVerification(true);
        
        // Prepare email verification
        await signUpContext.signUp?.prepareEmailAddressVerification({
          strategy: 'email_code',
        });
        
        showAlert('Please check your email for a verification code.', 'info');
      } else {
        setError('Account creation failed. Please try again.');
      }
    } catch (err: any) {
      // Handle Clerk errors
      const errorMessage = err.errors?.[0]?.message || err.message || 'Registration failed';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * STEP 3: Verify Email (if required)
   */
  const handleVerifyEmail = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!verificationCode) {
      setError('Please enter the verification code');
      return;
    }

    setVerifyingEmail(true);

    try {
      const result = await signUpContext.signUp?.attemptEmailAddressVerification({
        code: verificationCode,
      });

      if (result?.status === 'complete') {
        // Verification complete - set session and redirect
        await signUpContext.setActive({ session: result.createdSessionId });
        router.push('/dashboard');
      } else {
        setError('Verification failed. Please check the code and try again.');
      }
    } catch (err: any) {
      const errorMessage = err.errors?.[0]?.message || err.message || 'Verification failed';
      setError(errorMessage);
    } finally {
      setVerifyingEmail(false);
    }
  };

  /**
   * Resend verification code
   */
  const resendVerificationCode = async () => {
    try {
      await signUpContext.signUp?.prepareEmailAddressVerification({
        strategy: 'email_code',
      });
      showAlert('Verification code resent!', 'success');
    } catch (err: any) {
      setError(err.message || 'Failed to resend code');
    }
  };

  const showAlert = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const container = document.getElementById('alert-container');
    if (container) {
      const alert = document.createElement('div');
      alert.className = `alert alert-${type} mb-4`;
      alert.textContent = message;
      alert.setAttribute('role', 'alert');
      container.appendChild(alert);
      setTimeout(() => alert.remove(), 5000);
    }
  };

  // Show loading state while Clerk is loading
  if (!signUpContext.isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Geometric Pattern Background */}
      <div className="login-background" aria-hidden="true">
        <div className="pattern-tessellation"></div>
      </div>
      
      {/* Skip to main content link */}
      <a href="#main-content" className="sr-only">Skip to main content</a>
      
      {/* Main Container */}
      <main className="login-container" id="main-content">
        {/* Logo Section */}
        <div className="login-logo-section">
          <div className="logo-icon" aria-hidden="true">
            <svg viewBox="0 0 64 64" width="64" height="64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M32 0L38 24L64 32L38 40L32 64L26 40L0 32L26 24L32 0Z" fill="url(#star-gradient)"/>
              <circle cx="32" cy="32" r="12" fill="white"/>
              <defs>
                <linearGradient id="star-gradient" x1="0" y1="0" x2="64" y2="64">
                  <stop offset="0%" stopColor="#059669"/>
                  <stop offset="100%" stopColor="#047857"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1 className="logo-text">MuslimEEN</h1>
          <p className="logo-subtitle arabic-text" lang="ar" dir="rtl">الشبكة الاقتصادية الإسلامية</p>
          <p className="logo-tagline">Invitation-Only Access</p>
        </div>
        
        {/* Alert Container */}
        <div id="alert-container" aria-live="polite" aria-atomic="true"></div>
        
        {/* Registration Card */}
        <div className="login-card">
          <div className="login-card-header">
            <h2>Create Your Account</h2>
            <p>MuslimEEN is an invitation-only network</p>
          </div>
          
          <div className="login-card-body">
            {/* Error Display */}
            {error && (
              <div className="alert alert-error mb-4">{error}</div>
            )}
            
            {/* STEP 1: Invite Code Validation */}
            {!isInviteValid && (
              <div className="invitation-section">
                <div className="form-group">
                  <label htmlFor="invite-code" className="form-label form-label-required">
                    Invite Code
                  </label>
                  <div className="input-group">
                    <input 
                      type="text" 
                      id="invite-code" 
                      className="form-input" 
                      placeholder="Enter your invite code"
                      maxLength={64}
                      autoComplete="off"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      disabled={isValidatingInvite}
                    />
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      onClick={validateInvite}
                      disabled={isValidatingInvite || !inviteCode}
                    >
                      {isValidatingInvite ? 'Validating...' : 'Validate'}
                    </button>
                  </div>
                  {inviteError && (
                    <div className="form-error">{inviteError}</div>
                  )}
                  <p className="form-hint">
                    MuslimEEN is invitation-only. You need a valid invite code to register.
                  </p>
                </div>
                
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600">
                    Don&apos;t have an invite?{' '}
                    <a href="#" className="text-link" onClick={(e) => {
                      e.preventDefault();
                      showAlert('Request an invite from a member or partner institution', 'info');
                    }}>
                      Learn how to get one
                    </a>
                  </p>
                </div>
              </div>
            )}
            
            {/* STEP 2: Registration Form */}
            {isInviteValid && !pendingVerification && (
              <form onSubmit={handleRegister} noValidate>
                <div className="alert alert-success mb-4">
                  ✓ Invite validated! Complete your registration below.
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="firstName" className="form-label form-label-required">
                      First Name
                    </label>
                    <input 
                      type="text" 
                      id="firstName" 
                      className="form-input" 
                      placeholder="Your first name"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="lastName" className="form-label form-label-required">
                      Last Name
                    </label>
                    <input 
                      type="text" 
                      id="lastName" 
                      className="form-input" 
                      placeholder="Your last name"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="email" className="form-label form-label-required">
                    Email Address
                  </label>
                  <input 
                    type="email" 
                    id="email" 
                    className="form-input" 
                    placeholder="your@email.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={inviteData?.email} // Disable if invite has pre-assigned email
                  />
                  {inviteData?.email && (
                    <p className="form-hint">This email is linked to your invite code</p>
                  )}
                </div>
                
                <div className="form-group">
                  <label htmlFor="password" className="form-label form-label-required">
                    Password
                  </label>
                  <input 
                    type="password" 
                    id="password" 
                    className="form-input" 
                    placeholder="Create a strong password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <p className="form-hint">Minimum 8 characters</p>
                </div>
                
                <button 
                  type="submit" 
                  className="btn btn-primary btn-lg w-full"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </button>
                
                <button 
                  type="button"
                  className="btn btn-link w-full mt-4"
                  onClick={() => {
                    setIsInviteValid(false);
                    setInviteCode('');
                    setInviteData(null);
                  }}
                >
                  Use a different invite code
                </button>
              </form>
            )}
            
            {/* STEP 3: Email Verification */}
            {pendingVerification && (
              <form onSubmit={handleVerifyEmail} noValidate>
                <div className="alert alert-info mb-4">
                  Please check your email ({email}) for a verification code.
                </div>
                
                <div className="form-group">
                  <label htmlFor="verification-code" className="form-label form-label-required">
                    Verification Code
                  </label>
                  <input 
                    type="text" 
                    id="verification-code" 
                    className="form-input" 
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    required
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                  />
                </div>
                
                <button 
                  type="submit" 
                  className="btn btn-primary btn-lg w-full"
                  disabled={verifyingEmail}
                >
                  {verifyingEmail ? 'Verifying...' : 'Verify Email'}
                </button>
                
                <button 
                  type="button"
                  className="btn btn-link w-full mt-4"
                  onClick={resendVerificationCode}
                >
                  Resend verification code
                </button>
              </form>
            )}
          </div>
          
          <div className="login-card-footer">
            <p className="text-center text-sm">
              Already have an account?{' '}
              <a href="/login" className="text-link">Sign In</a>
            </p>
          </div>
        </div>
        
        {/* Platform Immutables */}
        <div className="immutables-section">
          <h3>Our Commitment</h3>
          <ul className="immutables-list">
            <li>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <span>No advertising or user data sales</span>
            </li>
            <li>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              <span>Open source forever with data portability</span>
            </li>
            <li>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
              </svg>
              <span>No interest-based finance (riba-free)</span>
            </li>
            <li>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <span>Non-discrimination by sect or ethnicity</span>
            </li>
            <li>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <line x1="3" y1="9" x2="21" y2="9"/>
                <line x1="9" y1="21" x2="9" y2="9"/>
              </svg>
              <span>Complete transparency in governance</span>
            </li>
            <li>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
              <span>No user fees; revenue to Waqf surplus</span>
            </li>
          </ul>
        </div>
        
        {/* Footer */}
        <footer className="login-footer">
          <p>&copy; 2024 MuslimEEN. Licensed under AGPL-3.0.</p>
        </footer>
      </main>
    </>
  );
}
