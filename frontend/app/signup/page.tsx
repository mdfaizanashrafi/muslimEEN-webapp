/**
 * Signup Page - HARDENED VERSION
 * 
 * SECURITY IMPROVEMENTS:
 * 1. Uses signed invite token (not raw code)
 * 2. Validates token expiry (10 minutes)
 * 3. Passes signed token to Clerk via metadata
 * 4. Webhook verifies signature before consuming
 * 
 * HARD RULE: No token = No signup
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
  const [tokenExpired, setTokenExpired] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check for signed invite token
    const token = localStorage.getItem('invite_token');
    const validatedAt = localStorage.getItem('invite_validated_at');

    if (!token) {
      // No token - redirect to invite page
      router.replace('/invite');
      return;
    }

    // Check token expiry
    if (validatedAt) {
      const age = Date.now() - parseInt(validatedAt);
      if (age > TOKEN_EXPIRY_MS) {
        setTokenExpired(true);
        localStorage.removeItem('invite_token');
        localStorage.removeItem('invite_validated_at');
      }
    }

    setInviteToken(token);
    setIsChecking(false);
  }, [router]);

  const handleClearToken = () => {
    localStorage.removeItem('invite_token');
    localStorage.removeItem('invite_validated_at');
    router.push('/invite');
  };

  // Show loading state while checking
  if (isChecking) {
    return (
      <main className="signup-page">
        <div className="signup-loading">
          <div className="spinner-large"></div>
          <p>Verifying your invite...</p>
        </div>
      </main>
    );
  }

  // Token expired
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

  // If no invite token, show redirect message
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
        {/* Header */}
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

        {/* Invite Badge */}
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

        {/* Clerk SignUp Component */}
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
              inviteToken: inviteToken, // SIGNED TOKEN (not raw code)
              source: 'web_invite_flow',
            }}
            redirectUrl="/dashboard"
            afterSignUpUrl="/dashboard"
          />
        </div>

        {/* Security Notice */}
        <div className="security-notice">
          <p>
            <strong>🔒 Invite-Only Platform</strong>
          </p>
          <p>
            This signup is tied to a validated invite. Our system maintains
            a trusted community through invite-based access.
          </p>
        </div>

        {/* Footer */}
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
