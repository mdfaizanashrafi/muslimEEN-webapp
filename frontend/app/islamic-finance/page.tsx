/**
 * Islamic Finance Page - Server Component
 * 
 * This page provides Shariah-compliant financial tools for the Muslim community.
 * Rendered on the server for optimal SEO with dynamic metadata.
 * 
 * @see SEO_IMPLEMENTATION_PLAN.md Phase 2
 */

import { Metadata } from 'next';
import { Suspense } from 'react';
import { generatePageMetadata, SITE_CONFIG } from '@/lib/seo/metadata';
import { BreadcrumbSchema, FAQSchema, islamicFinanceFAQs } from '@/components/seo';
import IslamicFinanceClient from './IslamicFinanceClient';

/**
 * Generate metadata for Islamic Finance page
 * Includes keywords for Islamic finance, zakat, sadaqah, waqf searches
 */
export const metadata: Metadata = generatePageMetadata({
  title: 'Islamic Finance Tools - Zakat, Sadaqah, Waqf & More',
  description: 'Access Shariah-compliant financial tools on MuslimEEN. Calculate Zakat, donate Sadaqah, explore Waqf opportunities, Qard Hasan loans, and Takaful insurance - all designed for the Muslim community.',
  path: '/islamic-finance',
  keywords: [
    'Islamic finance',
    'Shariah compliant',
    'Zakat calculator',
    'Sadaqah donation',
    'Waqf endowment',
    'Qard Hasan',
    'interest-free loan',
    'Takaful insurance',
    'halal finance',
    'Muslim charity',
  ],
});

/**
 * Loading fallback for the client component
 */
function IslamicFinanceLoading() {
  return (
    <div className="loading-screen" role="status" aria-live="polite">
      <div className="loading-spinner" aria-label="Loading Islamic finance tools" />
      <p>Loading Islamic finance tools...</p>
    </div>
  );
}

/**
 * Islamic Finance Page Component
 * 
 * The page header is rendered server-side for SEO,
 * while the interactive tabs are handled by the client component.
 */
export default function IslamicFinancePage() {
  const baseUrl = SITE_CONFIG.baseUrl;

  return (
    <>
      {/* Breadcrumb structured data for rich search results */}
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: baseUrl },
          { name: 'Islamic Finance', url: `${baseUrl}/islamic-finance` },
        ]}
      />

      {/* Page Header - Server Rendered for SEO */}
      <section className="finance-header" aria-labelledby="finance-heading">
        <div className="finance-header-content">
          <div className="finance-titles">
            <span className="finance-arabic-title" lang="ar">التمويل الإسلامي</span>
            <h1 id="finance-heading" className="finance-english-title">
              Islamic Finance Tools
            </h1>
            <p className="finance-subtitle">
              Shariah-compliant financial services for the Muslim community
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Content - Client Component */}
      <Suspense fallback={<IslamicFinanceLoading />}>
        <IslamicFinanceClient />
      </Suspense>
    </>
  );
}
