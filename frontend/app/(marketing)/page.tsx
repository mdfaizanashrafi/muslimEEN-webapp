'use client';

import Link from 'next/link';
import '../../styles/landing.css';

// Icons
const StarIcon = () => (
  <svg viewBox="0 0 32 32" width="32" height="32" fill="none">
    <path d="M16 0L19 12L32 16L19 20L16 32L13 20L0 16L13 12L16 0Z" fill="currentColor"/>
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
);

const ShieldIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const LockIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0110 0v4"/>
  </svg>
);

const CodeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="16 18 22 12 16 6"/>
    <polyline points="8 6 2 12 8 18"/>
  </svg>
);

const UsersIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
  </svg>
);

const LogOutIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
  </svg>
);

const EyeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const HeartIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

export default function LandingPage() {
  return (
    <div className="landing-page">
      {/* Header */}
      <header className="landing-header">
        <div className="landing-header-content">
          <Link href="/" className="landing-logo">
            <StarIcon />
            <span>MuslimEEN</span>
          </Link>
          <nav className="landing-nav">
            <Link href="#pillars" className="landing-nav-link">Ecosystem</Link>
            <Link href="#immutables" className="landing-nav-link">Principles</Link>
            <Link href="#verification" className="landing-nav-link">Verification</Link>

          </nav>
          <Link href="/login" className="btn btn-primary landing-cta">
            Join Now
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            A Complete Economic Ecosystem for Muslims
          </h1>
          <p className="hero-subtitle">
            Earn, Build, Live, Protect — owned by the community, 
            verified by the community, growing the community.
          </p>
          <div className="hero-actions">
            <Link href="/login" className="btn btn-primary btn-lg">
              Join the Network
              <ArrowRightIcon />
            </Link>
            <Link href="#pillars" className="btn btn-outline btn-lg">
              Explore Ecosystem
            </Link>
          </div>
        </div>
        <div className="hero-pattern" />
      </section>

      {/* 4 Pillars Section */}
      <section id="pillars" className="pillars-section">
        <div className="section-container">
          <h2 className="section-title">
            <span className="arabic-text">الأركان الأربعة</span>
            Four Pillars of Economic Empowerment
          </h2>
          
          <div className="pillars-grid">
            {/* EARN */}
            <div className="pillar-card pillar-earn">
              <div className="pillar-icon">
                <span className="arabic-icon">رزق</span>
              </div>
              <h3>EARN</h3>
              <ul>
                <li>Jobs</li>
                <li>Freelancers</li>
                <li>Professional Services</li>
                <li>Education</li>
                <li>Trades</li>
              </ul>
            </div>

            {/* BUILD */}
            <div className="pillar-card pillar-build">
              <div className="pillar-icon">
                <span className="arabic-icon">بناء</span>
              </div>
              <h3>BUILD</h3>
              <ul>
                <li>Ventures</li>
                <li>Real Estate</li>
                <li>Business</li>
                <li>Agriculture</li>
                <li>Tech</li>
              </ul>
            </div>

            {/* LIVE */}
            <div className="pillar-card pillar-live">
              <div className="pillar-icon">
                <span className="arabic-icon">حياة</span>
              </div>
              <h3>LIVE</h3>
              <ul>
                <li>Housing</li>
                <li>Food</li>
                <li>Travel</li>
                <li>Wellness</li>
                <li>Creative Services</li>
              </ul>
            </div>

            {/* PROTECT */}
            <div className="pillar-card pillar-protect">
              <div className="pillar-icon">
                <span className="arabic-icon">حفظ</span>
              </div>
              <h3>PROTECT</h3>
              <ul>
                <li>Health</li>
                <li>Security</li>
                <li>Insurance</li>
                <li>Legal</li>
                <li>Advocacy</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Immutables Section */}
      <section id="immutables" className="immutables-section">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">Our Immutables</h2>
            <p className="section-subtitle">
              The principles that can never be compromised. 
              These aren't features — they are the foundation of trust.
            </p>
          </div>

          <div className="immutables-grid">
            <div className="immutable-item">
              <ShieldIcon />
              <h4>No Advertising</h4>
              <p>Prevents haram product promotion, attention extraction</p>
            </div>
            <div className="immutable-item">
              <LockIcon />
              <h4>No Sale of User Data</h4>
              <p>Privacy as core value</p>
            </div>
            <div className="immutable-item">
              <CodeIcon />
              <h4>Open Source Forever</h4>
              <p>Prevents capture, enables forks</p>
            </div>
            <div className="immutable-item">
              <UsersIcon />
              <h4>Non-Discrimination</h4>
              <p>No sect/ethnicity discrimination</p>
            </div>
            <div className="immutable-item">
              <LogOutIcon />
              <h4>Right to Exit</h4>
              <p>Data portability guaranteed</p>
            </div>
            <div className="immutable-item">
              <HeartIcon />
              <h4>No Interest-Based Finance</h4>
              <p>Platform operations funded without riba</p>
            </div>
            <div className="immutable-item">
              <EyeIcon />
              <h4>Transparency</h4>
              <p>All governance, finances, code public</p>
            </div>
            <div className="immutable-item">
              <CheckIcon />
              <h4>No User Fees</h4>
              <p>Operations sustained by B2B services, surplus to Waqf</p>
            </div>
          </div>
        </div>
      </section>

      {/* Verification Section */}
      <section id="verification" className="verification-section">
        <div className="section-container">
          <h2 className="section-title">Universal Muslim Verification</h2>
          <p className="section-subtitle">
            Two-witness attestation of Islam unlocks access to the complete economic ecosystem
          </p>

          <div className="verification-process">
            <div className="process-step">
              <div className="step-number">1</div>
              <h4>Invitation</h4>
              <p>Invitation-only with two-member validation</p>
            </div>
            <div className="process-arrow">→</div>
            <div className="process-step">
              <div className="step-number">2</div>
              <h4>Witness Vouch</h4>
              <p>Two-witness attestation of Islam</p>
            </div>
            <div className="process-arrow">→</div>
            <div className="process-step">
              <div className="step-number">3</div>
              <h4>Biometric Lock</h4>
              <p>Reputation tied to biometric hash</p>
            </div>
            <div className="process-arrow">→</div>
            <div className="process-step">
              <div className="step-number">4</div>
              <h4>Trust Score</h4>
              <p>Activity-based reputation building</p>
            </div>
          </div>

          <div className="trust-score-info">
            <h3>Trust Score System</h3>
            <div className="trust-metrics">
              <div className="trust-metric">
                <span className="trust-value">1000</span>
                <span className="trust-label">Maximum points</span>
              </div>
              <div className="trust-metric">
                <span className="trust-value">&lt; 200</span>
                <span className="trust-label">Loses witness eligibility</span>
              </div>
              <div className="trust-metric">
                <span className="trust-value">&lt; 100</span>
                <span className="trust-label">Loses governance rights</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Revenue Model Section */}
      <section id="revenue" className="revenue-section">
        <div className="section-container">
          <h2 className="section-title">Sustainable Model</h2>
          <p className="section-subtitle">B2B/Institutional Only — Users never pay for access</p>

          <div className="revenue-grid">
            <div className="revenue-item">
              <h4>Conference/Event Hosting</h4>
              <p>Corporates, universities, Islamic orgs</p>
              <span className="revenue-tag">Per-event fee</span>
            </div>
            <div className="revenue-item">
              <h4>Sports Tournament Sponsorship</h4>
              <p>Brands, leagues, municipalities</p>
              <span className="revenue-tag">Sponsorship packages</span>
            </div>
            <div className="revenue-item">
              <h4>Business Delegation Access</h4>
              <p>Trade missions, investment funds</p>
              <span className="revenue-tag">Success fee</span>
            </div>
            <div className="revenue-item">
              <h4>Recruitment/HR Services</h4>
              <p>Companies seeking Muslim talent</p>
              <span className="revenue-tag">Per-hire fee</span>
            </div>
            <div className="revenue-item">
              <h4>Market Research</h4>
              <p>FMCG, halal certifiers, policymakers</p>
              <span className="revenue-tag">Subscription</span>
            </div>
            <div className="revenue-item">
              <h4>White-Label Verification</h4>
              <p>Banks, Hajj operators, Islamic insurers</p>
              <span className="revenue-tag">Per-verification fee</span>
            </div>
          </div>

          <div className="waqf-notice">
            <HeartIcon />
            <p>
              <strong>All Surplus Directed to Waqf</strong><br />
              Perpetual benefit for the community. Operations sustained by B2B services, 
              with all surplus directed to community Waqf for eternal reward.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="section-container">
          <h2>Ready to Join the Ecosystem?</h2>
          <p>Become part of a verified economic network built by and for the Muslim community.</p>
          <Link href="/login" className="btn btn-primary btn-lg">
            Get Started
            <ArrowRightIcon />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <StarIcon />
            <span>MuslimEEN</span>
          </div>
          <p className="footer-tagline">Muslim Economic Empowerment Network</p>
          <div className="footer-links">
            <Link href="/login">Login</Link>
            <Link href="#pillars">Ecosystem</Link>
            <Link href="#immutables">Principles</Link>
            <Link href="#verification">Verification</Link>
            <Link href="#revenue">Revenue</Link>
          </div>
          <p className="footer-copyright">© 2026 MuslimEEN. Open Source Forever.</p>
        </div>
      </footer>
    </div>
  );
}
