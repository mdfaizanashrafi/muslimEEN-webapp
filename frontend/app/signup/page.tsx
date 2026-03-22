/**
 * Signup Page - PRODUCTION VERSION
 * 
 * SECURITY:
 * 1. Controlled token state - NEVER null at render
 * 2. Safe localStorage access in useEffect only
 * 3. Strict expiry validation with immediate redirect
 * 4. Blocks render until token is validated
 * 
 * PRODUCTION: Debug logs removed - use structured logging only
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SignUp } from '@clerk/nextjs';
import Link from 'next/link';
import './signup.css';

const TOKEN_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

export default function SignupPage() {
  const router = useRouter();
  
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [tokenExpired, setTokenExpired] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('invite_token');
    const validatedAt = localStorage.getItem('invite_validated_at');

    if (!token || !validatedAt) {
      router.push('/invite');
      return;
    }

    const now = Date.now();
    const age = now - parseInt(validatedAt, 10);

    if (age > TOKEN_EXPIRY_MS) {
      localStorage.removeItem('invite_token');
      localStorage.removeItem('invite_validated_at');
      setTokenExpired(true);
      setIsLoaded(true);
      return;
    }

    setInviteToken(token);
    setIsLoaded(true);
  }, [router]);

  const handleClearToken = () => {
    localStorage.removeItem('invite_token');
    localStorage.removeItem('invite_validated_at');
    router.push('/invite');
  };

  if (!isLoaded) {
    return (
      <main className="signup-page">
        <div className="signup-loading">
          <div className="spinner-large"></div>
          <p>Verifying your invite...</p>
        </div>
      </main>
    );
  }

  if (tokenExpired) {
    return (
      <main className="signup-page">
        <div className="signup-error">
          <h1>Invite Expired</h1>
          <p>Your invite validation has expired. Please validate your code again.</p>
          <button onClick={handleClearToken} className="btn btn-primary">
            Re-validate Invite
          </button>
        </div>
      </main>
    );
  }

  if (!inviteToken) {
    return (
      <main className="signup-page">
        <div className="signup-error">
          <h1>Invite Required</h1>
          <p>MuslimEEN is invite-only. Please validate an invite code first.</p>
          <Link href="/invite" className="btn btn-primary">
            Get Invite
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="signup-page">
      <div className="signup-container">
        <div className="signup-header">
          <Link href="/" className="signup-logo">
            <div className="logo-icon">☪</div>
            <span>MuslimEEN</span>
          </Link>
          <h1>Create Your Account</h1>
          <p className="signup-subtitle">
            Join our community of Muslim professionals
          </p>
        </div>

        <div className="invite-badge">
          <div className="invite-badge-content">
            <span className="badge-label">✓ Invite Validated</span>
            <span className="badge-hint">Your invite is ready</span>
          </div>
          <button 
            onClick={handleClearToken}
            className="change-invite-btn"
            title="Use a different invite"
          >
            Change
          </button>
        </div>

        <div className="clerk-signup-wrapper">
          <SignUp 
            appearance={{
              elements: {
                rootBox: 'clerk-root',
                card: 'clerk-card',
                headerTitle: 'clerk-title',
                headerSubtitle: 'clerk-subtitle',
                formButtonPrimary: 'clerk-button-primary',
                formFieldInput: 'clerk-input',
                footer: 'clerk-footer',
              },
            }}
            unsafeMetadata={{
              inviteToken: inviteToken,
              source: 'web_invite_flow',
            }}
            redirectUrl="/dashboard"
            afterSignUpUrl="/dashboard"
          />
        </div>

        <div className="security-notice">
          <p>
            <strong>🔒 Invite-Only Platform</strong>
          </p>
          <p>
            This signup is tied to a validated invite. Our system maintains
            a trusted community through invite-based access.
          </p>
        </div>

        <div className="signup-footer">
          <p>
            Already have an account?{' '}
            <Link href="/login" className="text-link">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
