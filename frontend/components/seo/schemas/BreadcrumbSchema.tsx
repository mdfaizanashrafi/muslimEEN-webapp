/**
 * BreadcrumbSchema - Structured data for breadcrumb navigation
 * 
 * Enables breadcrumb trails in Google search results,
 * helping users understand page hierarchy and navigate the site.
 */

import SchemaInjector from '@/components/seo/SchemaInjector';
import { generateBreadcrumbSchema } from '@/lib/seo/metadata';

interface BreadcrumbItem {
  name: string;
  url?: string;
}

interface BreadcrumbSchemaProps {
  items: BreadcrumbItem[];
}

/**
 * Breadcrumb Schema Component
 * 
 * Usage:
 * ```tsx
 * <BreadcrumbSchema
 *   items={[
 *     { name: 'Home', url: 'https://muslimeen.space/' },
 *     { name: 'Marketplace', url: 'https://muslimeen.space/marketplace' },
 *     { name: 'EARN', url: 'https://muslimeen.space/marketplace/earn' },
 *     { name: 'Software Engineer', url: 'https://muslimeen.space/marketplace/earn/job-123' },
 *   ]}
 * />
 * ```
 * 
 * Note: The last item typically doesn't have a URL as it represents
 * the current page.
 */
export default function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
  const schema = generateBreadcrumbSchema(items);
  return <SchemaInjector schema={schema} />;
}

/**
 * Predefined breadcrumb helpers for common page types
 */

export function generateHomeBreadcrumbs(): BreadcrumbItem[] {
  return [{ name: 'Home' }];
}

export function generateMarketplaceBreadcrumbs(
  vertical?: string,
  category?: string
): BreadcrumbItem[] {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://muslimeen.space';
  const items: BreadcrumbItem[] = [
    { name: 'Home', url: baseUrl },
    { name: 'Marketplace', url: `${baseUrl}/marketplace` },
  ];

  if (vertical) {
    const verticalNames: Record<string, string> = {
      earn: 'EARN',
      build: 'BUILD',
      live: 'LIVE',
      protect: 'PROTECT',
    };
    items.push({
      name: verticalNames[vertical] || vertical,
      url: `${baseUrl}/marketplace/${vertical}`,
    });

    if (category) {
      items.push({
        name: category,
        url: `${baseUrl}/marketplace/${vertical}/${category}`,
      });
    }
  }

  return items;
}

export function generateProfileBreadcrumbs(
  name: string,
  slug: string
): BreadcrumbItem[] {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://muslimeen.space';
  return [
    { name: 'Home', url: baseUrl },
    { name: 'People', url: `${baseUrl}/people` },
    { name: name },
  ];
}

export function generateJobBreadcrumbs(
  jobTitle: string,
  slug: string
): BreadcrumbItem[] {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://muslimeen.space';
  return [
    { name: 'Home', url: baseUrl },
    { name: 'Marketplace', url: `${baseUrl}/marketplace` },
    { name: 'EARN', url: `${baseUrl}/marketplace/earn` },
    { name: jobTitle },
  ];
}
