/**
 * SEO Metadata Utilities
 * Centralized metadata generation for consistent SEO across the site
 */

import { Metadata, Viewport } from 'next';

// ============================================================================
// CONSTANTS
// ============================================================================

export const SITE_CONFIG = {
  name: 'MuslimEEN',
  fullName: 'Muslim Economic Empowerment Network',
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'https://muslimeen.space',
  defaultImage: '/og-default.png',
  twitterHandle: '@muslimeen',
  defaultLocale: 'en_US',
};

export const DEFAULT_KEYWORDS = [
  'Muslim professional network',
  'Islamic economy',
  'halal jobs',
  'Muslim business',
  'Islamic finance',
  'Shariah compliant',
  'Muslim entrepreneurs',
  'Islamic investment',
  'Muslim community',
  'halal marketplace',
];

// ============================================================================
// VIEWPORT CONFIGURATION
// ============================================================================

export const defaultViewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#059669',
  colorScheme: 'light',
};

// ============================================================================
// METADATA GENERATORS
// ============================================================================

interface PageMetadataParams {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: 'website' | 'profile' | 'article' | 'job';
  keywords?: string[];
  noIndex?: boolean;
  author?: string;
  publishedAt?: string;
  modifiedAt?: string;
  priority?: number;
}

/**
 * Generate comprehensive metadata for any page
 */
export function generatePageMetadata({
  title,
  description,
  path,
  image = SITE_CONFIG.defaultImage,
  type = 'website',
  keywords = [],
  noIndex = false,
  author,
  publishedAt,
  modifiedAt,
  priority,
}: PageMetadataParams): Metadata {
  const fullTitle = `${title} | ${SITE_CONFIG.name}`;
  const url = `${SITE_CONFIG.baseUrl}${path}`;
  
  // Ensure description is optimal length (150-160 chars)
  const optimizedDescription = description.length > 160 
    ? `${description.slice(0, 157)}...` 
    : description;

  return {
    // Basic metadata
    title: fullTitle,
    description: optimizedDescription,
    keywords: [...DEFAULT_KEYWORDS, ...keywords],
    authors: author ? [{ name: author }] : undefined,
    creator: author || SITE_CONFIG.name,
    publisher: SITE_CONFIG.name,
    
    // Robots
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    
    // Canonical URL
    alternates: {
      canonical: url,
      languages: {
        'en': url,
        'ar': `${SITE_CONFIG.baseUrl}/ar${path}`,
      },
    },
    
    // OpenGraph
    openGraph: {
      title: fullTitle,
      description: optimizedDescription,
      url,
      siteName: SITE_CONFIG.name,
      type: type === 'job' ? 'article' : type,
      locale: SITE_CONFIG.defaultLocale,
      images: [
        {
          url: image.startsWith('http') ? image : `${SITE_CONFIG.baseUrl}${image}`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      ...(publishedAt && { publishedTime: publishedAt }),
      ...(modifiedAt && { modifiedTime: modifiedAt }),
    },
    
    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: optimizedDescription,
      images: [image.startsWith('http') ? image : `${SITE_CONFIG.baseUrl}${image}`],
      creator: SITE_CONFIG.twitterHandle,
      site: SITE_CONFIG.twitterHandle,
    },
    
    // Verification (add your codes in environment variables)
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
    },
    
    // Metadata base
    metadataBase: new URL(SITE_CONFIG.baseUrl),
    
    // Other
    category: type === 'job' ? 'Jobs' : 'Business',
    referrer: 'origin-when-cross-origin',
    manifest: '/manifest.json',
    icons: {
      icon: '/favicon.png',
      apple: '/apple-touch-icon.png',
    },
  };
}

// ============================================================================
// PAGE-SPECIFIC METADATA GENERATORS
// ============================================================================

/**
 * Homepage metadata
 */
export function generateHomepageMetadata(): Metadata {
  return generatePageMetadata({
    title: 'Muslim Economic Empowerment Network',
    description: 'Join MuslimEEN - an invitation-only professional network for Muslims. Find halal jobs, business partnerships, Islamic financial tools, and connect with verified Muslim professionals worldwide.',
    path: '/',
    type: 'website',
    keywords: ['Muslim professional network', 'Islamic economy', 'Muslim business community'],
    priority: 1.0,
  });
}

/**
 * Profile page metadata
 */
interface ProfileMetadataParams {
  fullName: string;
  headline: string;
  bio?: string;
  slug: string;
  avatar?: string;
  industry?: string;
  location?: string;
  skills?: string[];
}

export function generateProfileMetadata({
  fullName,
  headline,
  bio,
  slug,
  avatar,
  industry,
  location,
  skills = [],
}: ProfileMetadataParams): Metadata {
  const title = `${fullName} - ${headline}`;
  const description = bio 
    ? `${bio.slice(0, 120)}... View ${fullName}'s professional profile on MuslimEEN.`
    : `View ${fullName}'s professional profile on MuslimEEN. ${industry || ''} professional${location ? ` based in ${location}` : ''}. Connect with verified Muslim professionals.`;
  
  return generatePageMetadata({
    title,
    description,
    path: `/people/${slug}`,
    image: avatar,
    type: 'profile',
    keywords: [industry, location, ...skills].filter(Boolean) as string[],
  });
}

/**
 * Marketplace vertical metadata
 */
interface MarketplaceMetadataParams {
  vertical: 'earn' | 'build' | 'live' | 'protect';
  category?: string;
}

const VERTICAL_METADATA: Record<string, { title: string; description: string; keywords: string[] }> = {
  earn: {
    title: 'EARN Marketplace - Halal Jobs & Professional Services',
    description: 'Find halal employment opportunities, connect with Muslim freelancers, and access professional services that align with Islamic values. Browse jobs in technology, finance, healthcare, and more.',
    keywords: ['halal jobs', 'Muslim freelancers', 'Islamic finance jobs', 'remote work Muslims'],
  },
  build: {
    title: 'BUILD Marketplace - Investment & Business Partnerships',
    description: 'Discover Shariah-compliant investment opportunities, business partnerships, and real estate ventures. Connect with Muslim entrepreneurs and investors building the Islamic economy.',
    keywords: ['Islamic investment', 'halal business', 'Muslim entrepreneurs', 'Islamic real estate'],
  },
  live: {
    title: 'LIVE Marketplace - Housing, Food & Lifestyle',
    description: 'Find halal housing, Islamic-compliant food services, travel experiences, and lifestyle products. Connect with Muslim-owned businesses serving the community.',
    keywords: ['halal housing', 'Islamic food', 'Muslim travel', 'modest fashion'],
  },
  protect: {
    title: 'PROTECT Marketplace - Health, Legal & Insurance',
    description: 'Access Shariah-compliant insurance (Takaful), healthcare services, legal assistance, and security solutions designed for Muslim families and businesses.',
    keywords: ['Takaful insurance', 'Islamic healthcare', 'Muslim legal services', 'halal insurance'],
  },
};

export function generateMarketplaceMetadata({ vertical, category }: MarketplaceMetadataParams): Metadata {
  const verticalData = VERTICAL_METADATA[vertical];
  const path = category 
    ? `/marketplace/${vertical}/${category}` 
    : `/marketplace/${vertical}`;
  
  return generatePageMetadata({
    title: verticalData.title,
    description: verticalData.description,
    path,
    keywords: verticalData.keywords,
  });
}

/**
 * Job listing metadata
 */
interface JobMetadataParams {
  title: string;
  company: string;
  location: string;
  description: string;
  slug: string;
  salary?: string;
}

export function generateJobMetadata({
  title,
  company,
  location,
  description,
  slug,
}: JobMetadataParams): Metadata {
  return generatePageMetadata({
    title: `${title} at ${company}`,
    description: `${description.slice(0, 120)}... Apply for this halal job opportunity in ${location} on MuslimEEN.`,
    path: `/marketplace/earn/${slug}`,
    type: 'job',
    keywords: [company, location, 'halal job', 'Islamic workplace'],
  });
}

/**
 * Private page metadata (noindex)
 */
export function generatePrivatePageMetadata(title: string): Metadata {
  return {
    title: `${title} | ${SITE_CONFIG.name}`,
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true,
      },
    },
  };
}

// ============================================================================
// JSON-LD SCHEMA GENERATORS
// ============================================================================

export interface OrganizationSchema {
  '@context': 'https://schema.org';
  '@type': 'Organization';
  name: string;
  url: string;
  logo: string;
  description: string;
  sameAs: string[];
}

export interface WebSiteSchema {
  '@context': 'https://schema.org';
  '@type': 'WebSite';
  name: string;
  url: string;
  description: string;
  potentialAction: {
    '@type': 'SearchAction';
    target: string;
    'query-input': string;
  };
}

export interface PersonSchema {
  '@context': 'https://schema.org';
  '@type': 'Person';
  name: string;
  jobTitle?: string;
  description?: string;
  url: string;
  image?: string;
  worksFor?: {
    '@type': 'Organization';
    name: string;
  };
  location?: {
    '@type': 'Place';
    address: {
      '@type': 'PostalAddress';
      addressLocality: string;
    };
  };
  knowsAbout?: string[];
}

export interface JobPostingSchema {
  '@context': 'https://schema.org';
  '@type': 'JobPosting';
  title: string;
  description: string;
  identifier: {
    '@type': 'PropertyValue';
    name: string;
    value: string;
  };
  datePosted: string;
  hiringOrganization: {
    '@type': 'Organization';
    name: string;
  };
  jobLocation: {
    '@type': 'Place';
    address: {
      '@type': 'PostalAddress';
      addressLocality: string;
    };
  };
  employmentType?: string;
  baseSalary?: {
    '@type': 'MonetaryAmount';
    currency: string;
    value: {
      '@type': 'QuantitativeValue';
      minValue?: number;
      maxValue?: number;
      unitText: string;
    };
  };
}

export interface BreadcrumbSchema {
  '@context': 'https://schema.org';
  '@type': 'BreadcrumbList';
  itemListElement: Array<{
    '@type': 'ListItem';
    position: number;
    name: string;
    item?: string;
  }>;
}

/**
 * Generate Organization schema
 */
export function generateOrganizationSchema(): OrganizationSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.baseUrl,
    logo: `${SITE_CONFIG.baseUrl}/logo.png`,
    description: 'Professional networking platform for the Muslim community with Islamic finance tools',
    sameAs: [
      'https://twitter.com/muslimeen',
      'https://linkedin.com/company/muslimeen',
      'https://github.com/muslimeen',
    ],
  };
}

/**
 * Generate WebSite schema with search
 */
export function generateWebSiteSchema(): WebSiteSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.baseUrl,
    description: SITE_CONFIG.fullName,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_CONFIG.baseUrl}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Generate Breadcrumb schema
 */
export function generateBreadcrumbSchema(items: Array<{ name: string; url?: string }>): BreadcrumbSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      ...(item.url && { item: item.url }),
    })),
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert schema object to JSON-LD script tag content
 */
export function serializeSchema(schema: object): string {
  return JSON.stringify(schema);
}

/**
 * Generate canonical URL
 */
export function generateCanonicalUrl(path: string): string {
  return `${SITE_CONFIG.baseUrl}${path}`;
}

/**
 * Truncate text for meta descriptions
 */
export function truncateDescription(text: string, maxLength: number = 160): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
}
