'use client';

import { useState, useEffect, FormEvent } from 'react';
import { auth } from '../../lib/api';
import '../../styles/login.css';

export default function LoginPage() {
  const [invitationCode, setInvitationCode] = useState('');
  const [isInvitationValid, setIsInvitationValid] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [invitationError, setInvitationError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const validateInvitation = async () => {
    if (!invitationCode || invitationCode.length !== 12) {
      setInvitationError('Invitation code must be 12 characters');
      return;
    }

    setIsValidating(true);
    setInvitationError('');

    try {
      const response = await auth.validateInvitation(invitationCode);
      if (response.success) {
        setIsInvitationValid(true);
        showAlert('Invitation validated! You can now log in.', 'success');
      } else {
        setInvitationError(response.message || 'Invalid invitation code');
      }
    } catch (err) {
      setInvitationError(err instanceof Error ? err.message : 'Validation failed');
    } finally {
      setIsValidating(false);
    }
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setIsLoading(true);

    try {
      const response = await auth.login(email, password, isInvitationValid ? invitationCode : undefined);
      if (response.success) {
        // Store session
        localStorage.setItem('muslimeen_session', JSON.stringify({
          token: response.token,
          user: response.user,
          expiresAt: Date.now() + 24 * 60 * 60 * 1000
        }));
        localStorage.setItem('muslimeen_csrf', response.csrfToken);
        
        // Redirect to dashboard
        window.location.href = '/dashboard';
      } else {
        setError(response.message || 'Login failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const showAlert = (message: string, type: 'success' | 'error' = 'success') => {
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

  useEffect(() => {
    // Close modal on Escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowRequestModal(false);
        setShowForgotModal(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <>
      {/* Geometric Pattern Background */}
      <div className="login-background" aria-hidden="true">
        <div className="pattern-tessellation"></div>
      </div>
      
      {/* Skip to main content link (accessibility) */}
      <a href="#main-content" className="sr-only">Skip to main content</a>
      
      {/* Main Container */}
      <main className="login-container" id="main-content">
        {/* Logo Section */}
        <div className="login-logo-section">
          <div className="logo-icon" aria-hidden="true">
            <svg viewBox="0 0 64 64" width="64" height="64" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* 8-point star geometric pattern */}
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
          <p className="logo-tagline">Muslim Economic Empowerment Network</p>
        </div>
        
        {/* Alert Container (aria-live for screen readers) */}
        <div id="alert-container" aria-live="polite" aria-atomic="true"></div>
        
        {/* Login Card */}
        <div className="login-card">
          <div className="login-card-header">
            <h2>Welcome Back</h2>
            <p>Invitation-only access for verified members</p>
          </div>
          
          <div className="login-card-body">
            {/* Invitation Code Section */}
            <div id="invitation-section" className={`invitation-section ${isInvitationValid ? 'validated' : ''}`}>
              <div className="form-group">
                <label htmlFor="invitation-code" className="form-label">Invitation Code</label>
                <div className="input-group">
                  <input 
                    type="text" 
                    id="invitation-code" 
                    className="form-input" 
                    placeholder="Enter your 12-character invitation code"
                    maxLength={12}
                    autoComplete="off"
                    aria-describedby="invitation-hint"
                    value={invitationCode}
                    onChange={(e) => setInvitationCode(e.target.value.toUpperCase())}
                    disabled={isInvitationValid}
                  />
                  <button 
                    type="button" 
                    id="validate-invitation" 
                    className={`btn btn-secondary ${isInvitationValid ? 'btn-success' : ''}`}
                    onClick={validateInvitation}
                    disabled={isValidating || isInvitationValid}
                  >
                    {isValidating ? 'Validating...' : isInvitationValid ? '✓ Valid' : 'Validate'}
                  </button>
                </div>
                {invitationError && (
                  <div className="form-error">{invitationError}</div>
                )}
                <p id="invitation-hint" className="form-hint">Invitation codes are provided by existing members or partner institutions</p>
              </div>
            </div>
            
            {/* Login Form */}
            <form id="login-form" className="login-form" noValidate onSubmit={handleLogin}>
              {error && (
                <div className="alert alert-error mb-4">{error}</div>
              )}
              
              <div className="form-group">
                <label htmlFor="email" className="form-label form-label-required">Email Address</label>
                <input 
                  type="email" 
                  id="email" 
                  className="form-input" 
                  placeholder="your@email.com"
                  autoComplete="email"
                  required
                  aria-required="true"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="password" className="form-label form-label-required">Password</label>
                <input 
                  type="password" 
                  id="password" 
                  className="form-input" 
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  aria-required="true"
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              
              <div className="form-group form-check">
                <input type="checkbox" id="remember-me" className="form-check-input" />
                <label htmlFor="remember-me" className="form-check-label">Remember me on this device</label>
              </div>
              
              <button type="submit" className="btn btn-primary btn-lg w-full" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
            
            {/* Divider */}
            <div className="login-divider" role="separator" aria-label="or sign in with">
              <span>or</span>
            </div>
            
            {/* Biometric Login */}
            <button type="button" id="biometric-login" className="btn btn-outline btn-lg w-full">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M12 2a10 10 0 0 0-10 10c0 5.523 4.477 10 10 10s10-4.477 10-10A10 10 0 0 0 12 2z"/>
                <path d="M12 6v6l4 2"/>
              </svg>
              Sign in with Biometric
            </button>
            
            <p className="biometric-note">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 16v-4M12 8h.01"/>
              </svg>
              Biometric data is processed on-device only. Zero-knowledge verification.
            </p>
          </div>
          
          <div className="login-card-footer">
            <div className="login-help">
              <a href="#" id="forgot-password" onClick={(e) => { e.preventDefault(); setShowForgotModal(true); }}>Forgot password?</a>
              <span className="divider" aria-hidden="true">|</span>
              <button type="button" id="request-invitation" className="btn-link" onClick={() => setShowRequestModal(true)}>
                Request Invitation
              </button>
            </div>
          </div>
        </div>
        
        {/* Platform Immutables */}
        <div className="immutables-section">
          <h3>Our Commitment</h3>
          <ul className="immutables-list">
            <li>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <span>No advertising or user data sales</span>
            </li>
            <li>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              <span>Open source forever with data portability</span>
            </li>
            <li>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
              </svg>
              <span>No interest-based finance (riba-free)</span>
            </li>
            <li>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <span>Non-discrimination by sect or ethnicity</span>
            </li>
            <li>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <line x1="3" y1="9" x2="21" y2="9"/>
                <line x1="9" y1="21" x2="9" y2="9"/>
              </svg>
              <span>Complete transparency in governance</span>
            </li>
            <li>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
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
          <p>
            <a href="#">Privacy Policy</a>
            <span className="mx-2" aria-hidden="true">|</span>
            <a href="#">Terms of Service</a>
            <span className="mx-2" aria-hidden="true">|</span>
            <a href="#">Code Repository</a>
          </p>
        </footer>
      </main>
      
      {/* Request Invitation Modal */}
      {showRequestModal && (
        <div id="request-invitation-modal" className="modal" role="dialog" aria-modal="true" aria-labelledby="request-modal-title">
          <div className="modal-backdrop" onClick={() => setShowRequestModal(false)} aria-hidden="true"></div>
          <div className="modal-content">
            <div className="modal-header">
              <h3 id="request-modal-title" className="modal-title">Request an Invitation</h3>
              <button type="button" className="modal-close" onClick={() => setShowRequestModal(false)} aria-label="Close modal">&times;</button>
            </div>
            <div className="modal-body">
              <p className="mb-4">MuslimEEN is an invitation-only network. You can request access through:</p>
              
              <div className="request-options">
                <div className="request-option">
                  <h4>1. Existing Member</h4>
                  <p>Ask a verified member to send you an invitation. Each member receives 5 invitations per month.</p>
                </div>
                
                <div className="request-option">
                  <h4>2. Partner Institution</h4>
                  <p>Contact your local mosque, Islamic university, or professional association that partners with MuslimEEN.</p>
                </div>
                
                <div className="request-option">
                  <h4>3. Community Application</h4>
                  <p>Submit a request to our community review board. Processing time: 7-14 days.</p>
                </div>
              </div>
              
              <form id="invitation-request-form" className="mt-6" noValidate>
                <div className="form-group">
                  <label htmlFor="request-email" className="form-label form-label-required">Your Email</label>
                  <input type="email" id="request-email" className="form-input" placeholder="your@email.com" required aria-required="true" />
                </div>
                
                <div className="form-group">
                  <label htmlFor="request-name" className="form-label form-label-required">Full Name</label>
                  <input type="text" id="request-name" className="form-input" placeholder="Your full name" required aria-required="true" />
                </div>
                
                <div className="form-group">
                  <label htmlFor="request-reason" className="form-label">Why do you want to join?</label>
                  <textarea id="request-reason" className="form-textarea" rows={3} placeholder="Briefly explain your interest in MuslimEEN..."></textarea>
                </div>
                
                <button type="submit" className="btn btn-primary w-full">Submit Request</button>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div id="forgot-password-modal" className="modal" role="dialog" aria-modal="true" aria-labelledby="forgot-modal-title">
          <div className="modal-backdrop" onClick={() => setShowForgotModal(false)} aria-hidden="true"></div>
          <div className="modal-content">
            <div className="modal-header">
              <h3 id="forgot-modal-title" className="modal-title">Reset Password</h3>
              <button type="button" className="modal-close" onClick={() => setShowForgotModal(false)} aria-label="Close modal">&times;</button>
            </div>
            <div className="modal-body">
              <p className="mb-4">Enter your email address and we&apos;ll send you a password reset link.</p>
              
              <form id="password-reset-form" noValidate>
                <div className="form-group">
                  <label htmlFor="reset-email" className="form-label form-label-required">Email Address</label>
                  <input type="email" id="reset-email" className="form-input" placeholder="your@email.com" required aria-required="true" />
                </div>
                
                <button type="submit" className="btn btn-primary w-full">Send Reset Link</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
