/**
 * PersonSchema - Structured data for user profiles
 * 
 * Enables rich search results for individual profiles including:
 * - Profile images in search results
 * - Job title and organization display
 * - Knowledge panel information
 */

import SchemaInjector from '@/components/seo/SchemaInjector';
import { PersonSchema as PersonSchemaType } from '@/lib/seo/metadata';

interface PersonSchemaProps {
  name: string;
  slug: string;
  jobTitle?: string;
  description?: string;
  image?: string;
  company?: string;
  location?: string;
  skills?: string[];
  trustScore?: number;
  verificationLevel?: string;
  joinedDate?: string;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
}

/**
 * Person Schema Component
 * 
 * Usage on profile pages:
 * ```tsx
 * <PersonSchema
 *   name="Ahmed Hassan"
 *   slug="ahmed-hassan-software-engineer"
 *   jobTitle="Senior Software Engineer"
 *   company="TechCorp"
 *   location="London, UK"
 *   skills={["React", "Node.js", "TypeScript"]}
 * />
 * ```
 */
export default function PersonSchema({
  name,
  slug,
  jobTitle,
  description,
  image,
  company,
  location,
  skills = [],
  trustScore,
  verificationLevel,
  joinedDate,
  socialLinks,
}: PersonSchemaProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://muslimeen.space';
  
  const schema: PersonSchemaType & {
    memberOf?: { '@type': 'Organization'; name: string };
    alumniOf?: { '@type': 'Organization'; name: string };
    knowsAbout?: string[];
    additionalProperty?: Array<{
      '@type': 'PropertyValue';
      name: string;
      value: string | number;
    }>;
    url?: string;
    sameAs?: string[];
  } = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    url: `${baseUrl}/people/${slug}`,
    ...(jobTitle && { jobTitle }),
    ...(description && { description }),
    ...(image && { image }),
    ...(company && {
      worksFor: {
        '@type': 'Organization',
        name: company,
      },
    }),
    ...(location && {
      address: {
        '@type': 'PostalAddress',
        addressLocality: location,
      },
    }),
    ...(skills.length > 0 && { knowsAbout: skills }),
  };

  // Add trust score and verification as additional properties
  const additionalProperties: Array<{
    '@type': 'PropertyValue';
    name: string;
    value: string | number;
  }> = [];

  if (trustScore !== undefined) {
    additionalProperties.push({
      '@type': 'PropertyValue',
      name: 'Trust Score',
      value: trustScore,
    });
  }

  if (verificationLevel) {
    additionalProperties.push({
      '@type': 'PropertyValue',
      name: 'Verification Level',
      value: verificationLevel,
    });
  }

  if (joinedDate) {
    additionalProperties.push({
      '@type': 'PropertyValue',
      name: 'Member Since',
      value: joinedDate,
    });
  }

  if (additionalProperties.length > 0) {
    schema.additionalProperty = additionalProperties;
  }

  // Add social links
  const sameAs: string[] = [];
  if (socialLinks?.linkedin) sameAs.push(socialLinks.linkedin);
  if (socialLinks?.twitter) sameAs.push(socialLinks.twitter);
  if (socialLinks?.website) sameAs.push(socialLinks.website);
  if (sameAs.length > 0) {
    schema.sameAs = sameAs;
  }

  return <SchemaInjector schema={schema} />;
}
