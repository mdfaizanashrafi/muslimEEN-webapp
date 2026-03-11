/**
 * Marketplace Vertical Page - Server Component
 * 
 * Dynamic marketplace pages for EARN, BUILD, LIVE, PROTECT verticals.
 * Server-rendered with enhanced metadata and structured data for SEO.
 * 
 * @see SEO_IMPLEMENTATION_PLAN.md Phase 2
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { generatePageMetadata, SITE_CONFIG } from '@/lib/seo/metadata';
import { BreadcrumbSchema } from '@/components/seo';
import MarketplaceClient from './client';

type VerticalType = 'earn' | 'build' | 'live' | 'protect';

interface VerticalConfig {
  title: string;
  arabic: string;
  description: string;
  longDescription: string;
  keywords: string[];
}

const verticalsConfig: Record<VerticalType, VerticalConfig> = {
  earn: {
    title: 'EARN',
    arabic: 'رزق',
    description: 'Jobs, Freelancers & Professional Services',
    longDescription: 'Find halal employment opportunities, connect with Muslim freelancers, and access professional services that align with Islamic values. Browse jobs in technology, finance, healthcare, and more.',
    keywords: [
      'halal jobs',
      'Muslim freelancers',
      'Islamic finance jobs',
      'remote work Muslims',
      'Shariah compliant jobs',
      'halal career',
      'Muslim professionals',
      'Islamic workplace',
    ],
  },
  build: {
    title: 'BUILD',
    arabic: 'بناء',
    description: 'Ventures, Partnerships & Real Estate',
    longDescription: 'Discover Shariah-compliant investment opportunities, business partnerships, and real estate ventures. Connect with Muslim entrepreneurs and investors building the Islamic economy.',
    keywords: [
      'Islamic investment',
      'halal business',
      'Muslim entrepreneurs',
      'Islamic real estate',
      'Shariah compliant investment',
      'Muslim business partners',
      'halal ventures',
      'Islamic crowdfunding',
    ],
  },
  live: {
    title: 'LIVE',
    arabic: 'حياة',
    description: 'Housing, Food & Lifestyle Services',
    longDescription: 'Find halal housing, Islamic-compliant food services, travel experiences, and lifestyle products. Connect with Muslim-owned businesses serving the community.',
    keywords: [
      'halal housing',
      'Islamic food',
      'Muslim travel',
      'modest fashion',
      'halal lifestyle',
      'Muslim friendly travel',
      'Islamic clothing',
      'Muslim services',
    ],
  },
  protect: {
    title: 'PROTECT',
    arabic: 'حفظ',
    description: 'Health, Security & Insurance',
    longDescription: 'Access Shariah-compliant insurance (Takaful), healthcare services, legal assistance, and security solutions designed for Muslim families and businesses.',
    keywords: [
      'Takaful insurance',
      'Islamic healthcare',
      'Muslim legal services',
      'halal insurance',
      'Shariah compliant insurance',
      'Islamic will writing',
      'Muslim doctors',
      'Islamic financial planning',
    ],
  },
};

/**
 * Generate static params for all verticals at build time
 */
export function generateStaticParams() {
  return [
    { vertical: 'earn' },
    { vertical: 'build' },
    { vertical: 'live' },
    { vertical: 'protect' },
  ];
}

/**
 * Generate metadata for each vertical marketplace
 */
export function generateMetadata({ params }: { params: { vertical: string } }): Metadata {
  const vertical = params.vertical as VerticalType;
  const config = verticalsConfig[vertical];
  
  if (!config) {
    return {
      title: 'Not Found - MuslimEEN',
    };
  }

  return generatePageMetadata({
    title: `${config.title} Marketplace - ${config.description}`,
    description: config.longDescription,
    path: `/marketplace/${vertical}`,
    keywords: config.keywords,
  });
}

/**
 * Loading fallback for marketplace
 */
function MarketplaceLoading() {
  return (
    <div className="marketplace-loading" role="status" aria-live="polite">
      <div className="loading-spinner" />
      <p>Loading marketplace...</p>
    </div>
  );
}

/**
 * Marketplace Vertical Page
 * 
 * Server-rendered header with breadcrumb schema,
 * client component for interactive elements
 */
export default function MarketplaceVerticalPage({ 
  params 
}: { 
  params: { vertical: string } 
}) {
  const vertical = params.vertical as VerticalType;
  const config = verticalsConfig[vertical];

  // Return 404 if vertical doesn't exist
  if (!config) {
    notFound();
  }

  const baseUrl = SITE_CONFIG.baseUrl;

  return (
    <>
      {/* Breadcrumb structured data */}
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: baseUrl },
          { name: 'Marketplace', url: `${baseUrl}/marketplace` },
          { name: config.title, url: `${baseUrl}/marketplace/${vertical}` },
        ]}
      />

      {/* Server-rendered content can go here in future */}
      
      {/* Interactive marketplace - Client Component */}
      <Suspense fallback={<MarketplaceLoading />}>
        <MarketplaceClient vertical={vertical} />
      </Suspense>
    </>
  );
}
