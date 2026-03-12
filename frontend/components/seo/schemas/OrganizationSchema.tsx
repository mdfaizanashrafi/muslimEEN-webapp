/**
 * OrganizationSchema - Structured data for MuslimEEN organization
 * 
 * Helps search engines understand the organization entity and enables
 * rich results like knowledge panels and brand search features.
 */

import SchemaInjector from '@/components/seo/SchemaInjector';
import {
  generateOrganizationSchema,
  generateWebSiteSchema,
  OrganizationSchema as OrganizationSchemaType,
  WebSiteSchema as WebSiteSchemaType,
} from '@/lib/seo/metadata';

interface OrganizationSchemaProps {
  includeWebSite?: boolean;
  customSchema?: Partial<OrganizationSchemaType>;
}

/**
 * Organization Schema Component
 * 
 * Should be included on:
 * - Homepage
 * - About page
 * - Contact page
 * - All public-facing pages
 */
export default function OrganizationSchema({
  includeWebSite = true,
  customSchema,
}: OrganizationSchemaProps) {
  const orgSchema: OrganizationSchemaType = {
    ...generateOrganizationSchema(),
    ...customSchema,
  };

  const schemas: (OrganizationSchemaType | WebSiteSchemaType)[] = [orgSchema];

  if (includeWebSite) {
    schemas.push(generateWebSiteSchema());
  }

  return <SchemaInjector schema={schemas} />;
}
