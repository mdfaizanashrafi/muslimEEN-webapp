/**
 * Waitlist Page
 * 
 * For users who don't have an invite code yet.
 * Collects email to notify when invites become available.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import './waitlist.css';

export default function WaitlistPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    setError('');

    // Simulate API call - in production, this would save to a waitlist table
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  return (
    <main className="waitlist-page">
      <div className="waitlist-container">
        {/* Logo */}
        <Link href="/" className="waitlist-logo">
          <div className="logo-icon">☪</div>
          <span>MuslimEEN</span>
        </Link>

        {!isSubmitted ? (
          <>
            <div className="waitlist-header">
              <h1>Join the Waitlist</h1>
              <p className="waitlist-subtitle">
                MuslimEEN is currently invite-only to ensure a trusted community.
                Leave your email and we&apos;ll notify you when spots open up.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="waitlist-form">
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="waitlist-input"
                  required
                  disabled={isSubmitting}
                />
              </div>

              {error && (
                <div className="waitlist-error">
                  <span>⚠</span> {error}
                </div>
              )}

              <button 
                type="submit" 
                className="btn btn-primary btn-lg btn-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner"></span>
                    Joining...
                  </>
                ) : (
                  'Join Waitlist'
                )}
              </button>
            </form>

            <div className="alternative-options">
              <p>Have an invite code?</p>
              <Link href="/invite" className="btn btn-outline btn-full">
                Use Invite Code
              </Link>
            </div>
          </>
        ) : (
          <div className="success-state">
            <div className="success-icon">✓</div>
            <h2>You&apos;re on the List!</h2>
            <p>
              We&apos;ve added <strong>{email}</strong> to our waitlist.
            </p>
            <p className="success-hint">
              We&apos;ll send you an email when invites become available.
              In the meantime, you can also ask a current member for an invite.
            </p>
            <Link href="/" className="btn btn-outline">
              Back to Home
            </Link>
          </div>
        )}

        {/* Info */}
        <div className="waitlist-info">
          <h3>Why Invite-Only?</h3>
          <ul>
            <li>🛡️ <strong>Trust & Safety:</strong> Every member is vouched for by someone in the community</li>
            <li>🤝 <strong>Quality Connections:</strong> Smaller, more engaged network of professionals</li>
            <li>🌟 <strong>Exclusivity:</strong> Access to opportunities not available on public platforms</li>
          </ul>
        </div>

        {/* Footer */}
        <div className="waitlist-footer">
          <Link href="/login" className="text-link">
            Already have an account? Log in
          </Link>
        </div>
      </div>
    </main>
  );
}
