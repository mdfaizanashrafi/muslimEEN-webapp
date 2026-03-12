/**
 * Connections/Network Page - Server Component
 * 
 * Professional networking directory for Muslim professionals.
 * Server-rendered for SEO with interactive client components.
 * 
 * @see SEO_IMPLEMENTATION_PLAN.md Phase 2
 */

import { Metadata } from 'next';
import { Suspense } from 'react';
import { generatePageMetadata, SITE_CONFIG } from '@/lib/seo/metadata';
import { BreadcrumbSchema } from '@/components/seo';
import ConnectionsClient from './ConnectionsClient';

/**
 * Generate metadata for Connections page
 * Optimized for professional networking searches
 */
export const metadata: Metadata = generatePageMetadata({
  title: 'Professional Network - Connect with Muslim Professionals',
  description: 'Build your professional network on MuslimEEN. Connect with verified Muslim professionals across industries. Find mentors, partners, and career opportunities in a trust-based community.',
  path: '/connections',
  keywords: [
    'Muslim professional network',
    'Islamic networking',
    'Muslim professionals',
    'halal LinkedIn',
    'Muslim career network',
    'Islamic business connections',
    'Muslim mentors',
    'professional ummah',
  ],
});

/**
 * Loading fallback for the connections list
 */
function ConnectionsLoading() {
  return (
    <div className="connections-loading" role="status" aria-live="polite">
      <div className="loading-skeleton">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="skeleton-card" />
        ))}
      </div>
    </div>
  );
}

/**
 * Connections Page Component
 * 
 * Server-rendered header for SEO, client component for interactivity
 */
export default function ConnectionsPage() {
  const baseUrl = SITE_CONFIG.baseUrl;

  return (
    <>
      {/* Breadcrumb structured data */}
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: baseUrl },
          { name: 'Network', url: `${baseUrl}/connections` },
        ]}
      />

      {/* Page Header - Server Rendered */}
      <section className="page-header" aria-labelledby="connections-heading">
        <h1 id="connections-heading">My Network</h1>
        <p className="text-secondary">Manage your connections and grow your professional circle</p>
      </section>

      {/* Interactive Content - Client Component */}
      <Suspense fallback={<ConnectionsLoading />}>
        <ConnectionsClient />
      </Suspense>
    </>
  );
}
