'use client';

import Link from 'next/link';
import { AppLayout } from '../../../components/layout';
import '../../../styles/verification.css';

/**
 * Business Verification - Coming Soon Page
 * 
 * This page serves as a placeholder for the Business Verification feature.
 * It provides a clear message to users and maintains the navigation structure.
 * 
 * FUTURE IMPLEMENTATION GUIDE:
 * ============================
 * 
 * 1. BUSINESS TYPES SUPPORTED:
 *    - Sole Proprietorship
 *    - Partnership
 *    - Limited Liability Company (LLC)
 *    - Corporation
 *    - Non-Profit Organization
 *    - Cooperative
 * 
 * 2. REQUIRED DOCUMENTS (by business type):
 *    
 *    For LLC/Corporation:
 *    - Certificate of Incorporation/Formation
 *    - Operating Agreement or Bylaws
 *    - EIN/Tax ID documentation
 *    - Business license (if applicable)
 *    
 *    For Sole Proprietorship:
 *    - Business registration certificate
 *    - Tax ID or SSN documentation
 *    - Business bank statements (3 months)
 *    
 *    For Non-Profits:
 *    - 501(c)(3) determination letter (US) or equivalent
 *    - Board of directors list
 *    - Annual financial reports
 * 
 * 3. VERIFICATION PROCESS:
 *    Step 1: Submit business information form
 *    Step 2: Upload required documents
 *    Step 3: Automated document verification (AI/ML)
 *    Step 4: Manual review by MuslimEEN team
 *    Step 5: Background check (optional for high-value businesses)
 *    Step 6: Approval or rejection with feedback
 * 
 * 4. COMPLIANCE REQUIREMENTS:
 *    - Shariah compliance attestation
 *    - Anti-money laundering (AML) check
 *    - Sanctions screening
 *    - Business must be operational (not shell companies)
 * 
 * 5. API INTEGRATIONS NEEDED:
 *    - Document verification services (Jumio, Onfido, or Trulioo)
 *    - Business registry lookups
 *    - Sanctions/watchlist screening (OFAC, UN, etc.)
 *    - Banking verification APIs
 * 
 * 6. DATABASE SCHEMA ADDITIONS:
 *    Table: business_verifications
 *    - id (UUID)
 *    - user_id (references users.id)
 *    - business_name
 *    - business_type (enum)
 *    - registration_number
 *    - tax_id
 *    - address (JSON)
 *    - documents (JSON array of uploaded files)
 *    - verification_status (pending, approved, rejected)
 *    - submitted_at, reviewed_at, approved_at
 *    - reviewed_by (admin user id)
 *    - rejection_reason (text)
 *    - shariah_compliant (boolean)
 * 
 * 7. UI COMPONENTS NEEDED:
 *    - Business type selector
 *    - Document upload component (drag & drop)
 *    - Progress tracker for verification steps
 *    - Status dashboard for pending applications
 *    - Admin review interface
 * 
 * 8. SHARIAH COMPLIANCE:
 *    - Checkbox: "I attest this business operates according to Islamic principles"
 *    - Prohibited industries check (gambling, alcohol, pork, etc.)
 *    - Interest-free financing confirmation
 */

const BusinessIcon = () => (
  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
  </svg>
);

const ClockIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12,6 12,12 16,14"/>
  </svg>
);

export default function BusinessVerificationPage() {
  return (
    <AppLayout activeNav="verification">
      <div className="verification-page">
        {/* Page Header */}
        <div className="page-header">
          <Link href="/verification" className="back-link">
            ← Back to Verification
          </Link>
          <h1>Business Verification</h1>
          <p className="subtitle">Verify your business to unlock marketplace features</p>
        </div>

        {/* Coming Soon Card */}
        <div className="coming-soon-card">
          <div className="coming-soon-icon">
            <BusinessIcon />
          </div>
          <h2 className="coming-soon-title">Coming Soon</h2>
          <p className="coming-soon-message">
            Business verification is currently under development. 
            We&apos;re building a comprehensive verification system to ensure 
            trust and authenticity in our marketplace.
          </p>

          {/* Expected Timeline */}
          <div className="timeline-info">
            <div className="timeline-item">
              <ClockIcon />
              <span>Expected launch: Q2 2026</span>
            </div>
          </div>

          {/* Features Preview */}
          <div className="features-preview">
            <h3>What to Expect</h3>
            <ul className="features-list">
              <li>
                <span className="feature-check">✓</span>
                <span>Business profile badge and enhanced trust indicators</span>
              </li>
              <li>
                <span className="feature-check">✓</span>
                <span>Priority listing in marketplace searches</span>
              </li>
              <li>
                <span className="feature-check">✓</span>
                <span>Access to B2B partnership opportunities</span>
              </li>
              <li>
                <span className="feature-check">✓</span>
                <span>Business analytics dashboard</span>
              </li>
              <li>
                <span className="feature-check">✓</span>
                <span>Shariah compliance certification</span>
              </li>
            </ul>
          </div>

          {/* Notification Signup */}
          <div className="notification-signup">
            <h3>Get Notified</h3>
            <p>Be the first to know when business verification launches</p>
            <div className="signup-form">
              <input
                type="email"
                placeholder="Enter your email"
                className="form-input"
              />
              <button className="btn btn-primary">Notify Me</button>
            </div>
          </div>

          {/* Documentation Link for Developers */}
          <div className="developer-info">
            <details className="dev-details">
              <summary>Developer Implementation Notes</summary>
              <div className="dev-content">
                <p>
                  <strong>Feature Status:</strong> Backend API in development, 
                  frontend components ready for integration.
                </p>
                <p>
                  <strong>Key Files:</strong>
                </p>
                <ul>
                  <li>API: POST /api/v1/verification/business/submit</li>
                  <li>API: GET /api/v1/verification/business/status</li>
                  <li>API: POST /api/v1/verification/business/documents</li>
                </ul>
                <p>
                  <strong>Integration Partners:</strong> Document verification 
                  service integration pending vendor selection.
                </p>
              </div>
            </details>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
