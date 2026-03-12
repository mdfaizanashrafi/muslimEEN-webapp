/**
 * About Page - Server Component
 * 
 * Demonstrates SEO-optimized Server Component with:
 * - Custom metadata generation
 * - Organization schema
 * - Breadcrumb structured data
 * - Full server-side rendering
 */

import { Metadata } from 'next';
import Link from 'next/link';
import {
  generatePageMetadata,
  generateBreadcrumbSchema,
  SITE_CONFIG,
} from '@/lib/seo/metadata';
import { OrganizationSchema, BreadcrumbSchema, FAQSchema, verificationFAQs } from '@/components/seo';

/**
 * Generate metadata for About page
 */
export const metadata: Metadata = generatePageMetadata({
  title: 'About MuslimEEN',
  description: 'Learn about MuslimEEN (Muslim Economic Empowerment Network) - an invitation-only professional network for the Muslim community with Shariah-compliant financial tools and trust-based verification.',
  path: '/about',
  keywords: [
    'MuslimEEN mission',
    'Islamic professional network',
    'Muslim community platform',
    'Shariah compliant finance',
    'trust-based verification',
  ],
});

export default function AboutPage() {
  const baseUrl = SITE_CONFIG.baseUrl;

  return (
    <>
      {/* FAQ Schema for rich search results */}
      <FAQSchema items={verificationFAQs} />

      {/* Breadcrumb structured data */}
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: baseUrl },
          { name: 'About', url: `${baseUrl}/about` },
        ]}
      />

      <main className="about-page">
        <section className="about-hero">
          <div className="container">
            <h1>About MuslimEEN</h1>
            <p className="lead">
              Building economic power for the global Muslim community through 
              trust-based networking and Shariah-compliant tools.
            </p>
          </div>
        </section>

        <section className="about-mission">
          <div className="container">
            <h2>Our Mission</h2>
            <p>
              MuslimEEN (Muslim Economic Empowerment Network) is an invitation-only 
              professional networking platform designed specifically for the Muslim 
              community. We combine professional networking with Islamic finance tools 
              in a trust-based ecosystem.
            </p>
            <p>
              Our mission is to create economic opportunities that align with Islamic 
              values, connecting Muslims worldwide for professional growth, business 
              partnerships, and community wealth building.
            </p>
          </div>
        </section>

        <section className="about-principles">
          <div className="container">
            <h2>Core Principles</h2>
            <div className="principles-grid">
              <article>
                <h3>Trust-Based Verification</h3>
                <p>
                  Our unique 0-1000 trust score system ensures community quality 
                  through biometric verification and two-witness attestation.
                </p>
              </article>
              <article>
                <h3>Shariah Compliance</h3>
                <p>
                  All financial tools - Zakat calculator, Qard Hasan, Sadaqah, 
                  and Waqf - are designed to be fully Shariah-compliant.
                </p>
              </article>
              <article>
                <h3>Community Ownership</h3>
                <p>
                  No advertising, no data sales, open source forever. 
                  All surplus revenue directed to community Waqf.
                </p>
              </article>
              <article>
                <h3>Four Pillars</h3>
                <p>
                  EARN (jobs & services), BUILD (investments & ventures), 
                  LIVE (housing & lifestyle), PROTECT (health & insurance).
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="about-verification">
          <div className="container">
            <h2>Verification Process</h2>
            <ol className="verification-steps">
              <li>
                <strong>Invitation</strong>
                <p>Receive invitation from existing verified member</p>
              </li>
              <li>
                <strong>Two-Witness Attestation</strong>
                <p>Two verified members vouch for your Muslim identity</p>
              </li>
              <li>
                <strong>Biometric Lock</strong>
                <p>Your reputation is tied to your unique biometric hash</p>
              </li>
              <li>
                <strong>Trust Score Building</strong>
                <p>Earn points through positive community participation</p>
              </li>
            </ol>
          </div>
        </section>

        <section className="about-cta">
          <div className="container">
            <h2>Join the Movement</h2>
            <p>
              Be part of a verified economic network built by and for 
              the Muslim community.
            </p>
            <Link href="/login" className="btn btn-primary btn-lg">
              Get Invited
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
