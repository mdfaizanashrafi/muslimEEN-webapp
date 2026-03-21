/**
 * Invite Validation Page - HARDENED VERSION
 * 
 * SECURITY IMPROVEMENTS:
 * 1. Uses signed tokens (not raw invite codes)
 * 2. Stores signed token in localStorage (tamper-proof)
 * 3. Token expires after 10 minutes
 * 4. Rate limiting handled by backend
 * 
 * Flow:
 * 1. User enters invite code
 * 2. Backend validates and returns SIGNED TOKEN
 * 3. Frontend stores signed token (not raw code)
 * 4. Signup passes signed token to Clerk
 * 5. Webhook verifies signature before consuming
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import './invite.css';

interface ValidationResponse {
  success: boolean;
  valid: boolean;
  signedToken?: string;
  error?: string;
}

export default function InvitePage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');
  const [hasValidToken, setHasValidToken] = useState(false);

  // Check for existing valid token on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('invite_token');
    if (storedToken) {
      setHasValidToken(true);
    }
  }, []);

  const validateInviteCode = async (inviteCode: string) => {
    setIsValidating(true);
    setError('');

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/invites/validate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: inviteCode }),
        }
      );

      const result: ValidationResponse = await response.json();

      if (result.success && result.valid && result.signedToken) {
        // Store SIGNED TOKEN (not raw code)
        localStorage.setItem('invite_token', result.signedToken);
        localStorage.setItem('invite_validated_at', Date.now().toString());
        
        // Redirect to signup
        router.push('/signup');
      } else {
        // SECURITY: Generic error message
        setError(result.error || 'Invalid or expired invite code');
      }
    } catch (err) {
      setError('Failed to validate invite. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Please enter an invite code');
      return;
    }
    await validateInviteCode(code.trim());
  };

  const handleContinueWithExisting = () => {
    router.push('/signup');
  };

  const handleClearToken = () => {
    localStorage.removeItem('invite_token');
    localStorage.removeItem('invite_validated_at');
    setHasValidToken(false);
  };

  return (
    <main className="invite-page">
      <div className="invite-container">
        {/* Logo */}
        <Link href="/" className="invite-logo">
          <div className="logo-icon">☪</div>
          <span>MuslimEEN</span>
        </Link>

        {/* Header */}
        <div className="invite-header">
          <h1>You&apos;ve Been Invited</h1>
          <p className="invite-subtitle">
            MuslimEEN is an invite-only community of Muslim professionals.
          </p>
        </div>

        {/* Existing Token State */}
        {hasValidToken && (
          <div className="existing-token-banner">
            <div className="banner-content">
              <span className="banner-icon">✓</span>
              <span>You have a validated invite</span>
            </div>
            <div className="banner-actions">
              <button 
                onClick={handleContinueWithExisting}
                className="btn btn-primary"
              >
                Continue to Signup
              </button>
              <button 
                onClick={handleClearToken}
                className="btn btn-ghost btn-sm"
              >
                Use Different Code
              </button>
            </div>
          </div>
        )}

        {/* Form State */}
        {!hasValidToken && (
          <form onSubmit={handleSubmit} className="invite-form">
            <div className="form-group">
              <label htmlFor="invite-code">Enter Your Invite Code</label>
              <div className="invite-input-wrapper">
                <input
                  id="invite-code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="MUSLIM-XXXXXX"
                  className="invite-input"
                  maxLength={20}
                  autoFocus
                  disabled={isValidating}
                />
                {code && (
                  <button 
                    type="button" 
                    className="clear-btn"
                    onClick={() => setCode('')}
                  >
                    ×
                  </button>
                )}
              </div>
              <p className="input-hint">Codes are case-insensitive</p>
            </div>

            {error && (
              <div className="invite-error">
                <span className="error-icon">⚠</span>
                {error}
              </div>
            )}

            <button 
              type="submit" 
              className="btn btn-primary btn-lg btn-full"
              disabled={isValidating || !code.trim()}
            >
              {isValidating ? (
                <>
                  <span className="spinner"></span>
                  Validating...
                </>
              ) : (
                'Validate Invite'
              )}
            </button>
          </form>
        )}

        {/* Info Section */}
        <div className="invite-info">
          <h3>What is MuslimEEN?</h3>
          <p>
            The Muslim Economic Empowerment Network connects Muslim professionals 
            for halal career opportunities, business partnerships, and community building.
          </p>
          
          <div className="invite-features">
            <div className="feature">
              <span className="feature-icon">🤝</span>
              <span>Trust-based networking</span>
            </div>
            <div className="feature">
              <span className="feature-icon">💼</span>
              <span>Halal job opportunities</span>
            </div>
            <div className="feature">
              <span className="feature-icon">🕌</span>
              <span>Islamic finance tools</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="invite-footer">
          <p>Don&apos;t have an invite?</p>
          <Link href="/waitlist" className="text-link">
            Join the waitlist
          </Link>
          <span className="separator">•</span>
          <Link href="/login" className="text-link">
            Already have an account? Log in
          </Link>
        </div>
      </div>
    </main>
  );
}
