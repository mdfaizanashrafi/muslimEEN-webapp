/**
 * SEO Components - Barrel Export
 * 
 * All SEO-related components and utilities in one place
 */

// Schema Components
export { default as SchemaInjector } from './SchemaInjector';
export { default as OrganizationSchema } from './schemas/OrganizationSchema';
export { default as PersonSchema } from './schemas/PersonSchema';
export { default as JobPostingSchema } from './schemas/JobPostingSchema';
export { 
  default as BreadcrumbSchema,
  generateHomeBreadcrumbs,
  generateMarketplaceBreadcrumbs,
  generateProfileBreadcrumbs,
  generateJobBreadcrumbs,
} from './schemas/BreadcrumbSchema';
export { 
  default as FAQSchema,
  homepageFAQs,
  verificationFAQs,
  islamicFinanceFAQs,
} from './schemas/FAQSchema';
export { default as LocalBusinessSchema } from './schemas/LocalBusinessSchema';
export { 
  default as ArticleSchema,
  CollectionPageSchema,
  ItemListSchema,
} from './schemas/ArticleSchema';

// Re-export utilities
export {
  // Constants
  SITE_CONFIG,
  DEFAULT_KEYWORDS,
  defaultViewport,
  
  // Metadata generators
  generatePageMetadata,
  generateHomepageMetadata,
  generateProfileMetadata,
  generateMarketplaceMetadata,
  generateJobMetadata,
  generatePrivatePageMetadata,
  
  // Schema generators
  generateOrganizationSchema,
  generateWebSiteSchema,
  generateBreadcrumbSchema,
  
  // Utilities
  serializeSchema,
  generateCanonicalUrl,
  truncateDescription,
  
  // Types
  type OrganizationSchema as OrganizationSchemaType,
  type WebSiteSchema as WebSiteSchemaType,
  type PersonSchema as PersonSchemaType,
  type JobPostingSchema as JobPostingSchemaType,
  type BreadcrumbSchema as BreadcrumbSchemaType,
} from '@/lib/seo/metadata';

// HowTo Schema
export { 
  default as HowToSchema,
  zakatHowTo,
  verificationHowTo,
  jobApplicationHowTo,
  networkingHowTo,
} from './schemas/HowToSchema';

// Video Schema
export { 
  default as VideoSchema,
  VideoGallerySchema,
} from './schemas/VideoSchema';

// Event Schema
export { 
  default as EventSchema,
  EventSeriesSchema,
} from './schemas/EventSchema';

// Analytics
export {
  GoogleAnalytics,
  GoogleTagManager,
  GoogleTagManagerNoScript,
  SearchConsoleVerification,
  MicrosoftClarity,
  Hotjar,
  trackEvent,
  AnalyticsEvents,
} from './Analytics';
