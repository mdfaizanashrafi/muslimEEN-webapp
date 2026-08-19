/**
 * Landing Page - Server Component
 * 
 * This page is rendered on the server for optimal SEO.
 * All content is immediately available to search engines.
 * 
 * @see SEO_IMPLEMENTATION_PLAN.md for migration details
 */

import Link from 'next/link';
import '../../styles/landing.css';
import { Metadata } from 'next';
import { generateHomepageMetadata } from '@/lib/seo/metadata';
import { FAQSchema, homepageFAQs } from '@/components/seo';
import {
  StarIcon,
  ArrowRightIcon,
  ShieldIcon,
  LockIcon,
  CodeIcon,
  UsersIcon,
  LogOutIcon,
  EyeIcon,
  HeartIcon,
  CheckIcon,
} from '@/components/icons/LandingIcons';

/**
 * SEO Metadata for Homepage
 * Includes OpenGraph, Twitter Cards, and structured data
 */
export const metadata: Metadata = generateHomepageMetadata();

export default function LandingPage() {
  return (
    <>
      {/* FAQ Schema for rich search results */}
      <FAQSchema items={homepageFAQs} />
      
      <div className="landing-page">
      {/* Header */}
      <header className="landing-header">
        <div className="landing-header-content">
          <Link href="/" className="landing-logo">
            <StarIcon />
            <span>MuslimEEN</span>
          </Link>
          <nav className="landing-nav" aria-label="Main navigation">
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
      <section className="hero-section" aria-labelledby="hero-heading">
        <div className="hero-content">
          <h1 id="hero-heading" className="hero-title">
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
            <a
              href="https://docs.google.com/forms/d/1pS1Y7o9ray7onuUr3_rGFsEhDTSPfhaS1UF-noVbhSY/viewform?chromeless=1&edit_requested=true"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline btn-lg"
            >
              Get Early Access
            </a>
            <Link href="#pillars" className="btn btn-outline btn-lg">
              Explore Ecosystem
            </Link>
          </div>
        </div>
        <div className="hero-pattern" aria-hidden="true" />
      </section>

      {/* 4 Pillars Section */}
      <section id="pillars" className="pillars-section" aria-labelledby="pillars-heading">
        <div className="section-container">
          <h2 id="pillars-heading" className="section-title">
            <span className="arabic-text">الأركان الأربعة</span>
            Four Pillars of Economic Empowerment
          </h2>
          
          <div className="pillars-grid">
            {/* EARN */}
            <article className="pillar-card pillar-earn">
              <div className="pillar-icon">
                <span className="arabic-icon" lang="ar">رزق</span>
              </div>
              <h3>EARN</h3>
              <ul>
                <li>Jobs</li>
                <li>Freelancers</li>
                <li>Professional Services</li>
                <li>Education</li>
                <li>Trades</li>
              </ul>
            </article>

            {/* BUILD */}
            <article className="pillar-card pillar-build">
              <div className="pillar-icon">
                <span className="arabic-icon" lang="ar">بناء</span>
              </div>
              <h3>BUILD</h3>
              <ul>
                <li>Ventures</li>
                <li>Real Estate</li>
                <li>Business</li>
                <li>Agriculture</li>
                <li>Tech</li>
              </ul>
            </article>

            {/* LIVE */}
            <article className="pillar-card pillar-live">
              <div className="pillar-icon">
                <span className="arabic-icon" lang="ar">حياة</span>
              </div>
              <h3>LIVE</h3>
              <ul>
                <li>Housing</li>
                <li>Food</li>
                <li>Travel</li>
                <li>Wellness</li>
                <li>Creative Services</li>
              </ul>
            </article>

            {/* PROTECT */}
            <article className="pillar-card pillar-protect">
              <div className="pillar-icon">
                <span className="arabic-icon" lang="ar">حفظ</span>
              </div>
              <h3>PROTECT</h3>
              <ul>
                <li>Health</li>
                <li>Security</li>
                <li>Insurance</li>
                <li>Legal</li>
                <li>Advocacy</li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      {/* Immutables Section */}
      <section id="immutables" className="immutables-section" aria-labelledby="immutables-heading">
        <div className="section-container">
          <div className="section-header">
            <h2 id="immutables-heading" className="section-title">Our Immutables</h2>
            <p className="section-subtitle">
              The principles that can never be compromised. 
              These aren&apos;t features — they are the foundation of trust.
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
      <section id="verification" className="verification-section" aria-labelledby="verification-heading">
        <div className="section-container">
          <h2 id="verification-heading" className="section-title">Universal Muslim Verification</h2>
          <p className="section-subtitle">
            Two-witness attestation of Islam unlocks access to the complete economic ecosystem
          </p>

          <div className="verification-process">
            <div className="process-step">
              <div className="step-number">1</div>
              <h4>Invitation</h4>
              <p>Invitation-only with two-member validation</p>
            </div>
            <div className="process-arrow" aria-hidden="true">→</div>
            <div className="process-step">
              <div className="step-number">2</div>
              <h4>Witness Vouch</h4>
              <p>Two-witness attestation of Islam</p>
            </div>
            <div className="process-arrow" aria-hidden="true">→</div>
            <div className="process-step">
              <div className="step-number">3</div>
              <h4>Biometric Lock</h4>
              <p>Reputation tied to biometric hash</p>
            </div>
            <div className="process-arrow" aria-hidden="true">→</div>
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
      <section id="revenue" className="revenue-section" aria-labelledby="revenue-heading">
        <div className="section-container">
          <h2 id="revenue-heading" className="section-title">Sustainable Model</h2>
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
      <section className="cta-section" aria-labelledby="cta-heading">
        <div className="section-container">
          <h2 id="cta-heading">Ready to Join the Ecosystem?</h2>
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
          <nav className="footer-links" aria-label="Footer navigation">
            <Link href="/login">Login</Link>
            <Link href="#pillars">Ecosystem</Link>
            <Link href="#immutables">Principles</Link>
            <Link href="#verification">Verification</Link>
            <Link href="#revenue">Revenue</Link>
          </nav>
          <p className="footer-copyright">© 2026 MuslimEEN. Open Source Forever.</p>
        </div>
      </footer>
    </div>
    </>
  );
}
