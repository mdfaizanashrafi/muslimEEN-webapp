/**
 * LocalBusiness Schema Component
 * 
 * For service providers, businesses, and professionals offering local services.
 * Helps with local SEO and Google Maps visibility.
 * 
 * @see https://schema.org/LocalBusiness
 */

import SchemaInjector from '@/components/seo/SchemaInjector';

interface LocalBusinessSchemaProps {
  name: string;
  type?: 'LocalBusiness' | 'LegalService' | 'MedicalBusiness' | 'ProfessionalService' | 'FinancialService';
  description: string;
  url: string;
  telephone?: string;
  email?: string;
  address: {
    street?: string;
    city: string;
    region?: string;
    postalCode?: string;
    country: string;
  };
  geo?: {
    latitude: number;
    longitude: number;
  };
  image?: string;
  priceRange?: string;
  openingHours?: string[];
  paymentAccepted?: string[];
  currenciesAccepted?: string[];
  areaServed?: string;
  hasOfferCatalog?: {
    name: string;
    itemList: Array<{
      name: string;
      description?: string;
      price?: string;
      priceCurrency?: string;
    }>;
  };
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
  };
  review?: Array<{
    author: string;
    datePublished: string;
    reviewBody: string;
    reviewRating: number;
  }>;
}

/**
 * LocalBusiness Schema Component
 * 
 * Usage for a law firm:
 * ```tsx
 * <LocalBusinessSchema
 *   name="Ibrahim Law Associates"
 *   type="LegalService"
 *   description="Shariah-compliant legal services"
 *   address={{ city: 'London', country: 'UK' }}
 *   telephone="+44 20 1234 5678"
 * />
 * ```
 */
export default function LocalBusinessSchema({
  name,
  type = 'LocalBusiness',
  description,
  url,
  telephone,
  email,
  address,
  geo,
  image,
  priceRange,
  openingHours,
  paymentAccepted,
  currenciesAccepted,
  areaServed,
  hasOfferCatalog,
  aggregateRating,
  review,
}: LocalBusinessSchemaProps) {
  const schema: {
    '@context': 'https://schema.org';
    '@type': string;
    name: string;
    description: string;
    url: string;
    address: {
      '@type': 'PostalAddress';
      streetAddress?: string;
      addressLocality: string;
      addressRegion?: string;
      postalCode?: string;
      addressCountry: string;
    };
    telephone?: string;
    email?: string;
    geo?: {
      '@type': 'GeoCoordinates';
      latitude: number;
      longitude: number;
    };
    image?: string;
    priceRange?: string;
    openingHours?: string[];
    paymentAccepted?: string[];
    currenciesAccepted?: string[];
    areaServed?: string;
    hasOfferCatalog?: {
      '@type': 'OfferCatalog';
      name: string;
      itemListElement: Array<{
        '@type': 'Offer';
        itemOffered: {
          '@type': 'Service';
          name: string;
          description?: string;
        };
        price?: string;
        priceCurrency?: string;
      }>;
    };
    aggregateRating?: {
      '@type': 'AggregateRating';
      ratingValue: number;
      reviewCount: number;
    };
    review?: Array<{
      '@type': 'Review';
      author: { '@type': 'Person'; name: string };
      datePublished: string;
      reviewBody: string;
      reviewRating: { '@type': 'Rating'; ratingValue: number };
    }>;
  } = {
    '@context': 'https://schema.org',
    '@type': type,
    name,
    description,
    url,
    address: {
      '@type': 'PostalAddress',
      ...(address.street && { streetAddress: address.street }),
      addressLocality: address.city,
      ...(address.region && { addressRegion: address.region }),
      ...(address.postalCode && { postalCode: address.postalCode }),
      addressCountry: address.country,
    },
    ...(telephone && { telephone }),
    ...(email && { email }),
    ...(geo && {
      geo: {
        '@type': 'GeoCoordinates',
        latitude: geo.latitude,
        longitude: geo.longitude,
      },
    }),
    ...(image && { image }),
    ...(priceRange && { priceRange }),
    ...(openingHours && { openingHoursSpecification: openingHours.map(hours => ({
      '@type': 'OpeningHoursSpecification',
      opens: hours.split('-')[0],
      closes: hours.split('-')[1],
      dayOfWeek: 'Monday Tuesday Wednesday Thursday Friday Saturday Sunday'.split(' '),
    })) }),
    ...(paymentAccepted && { paymentAccepted }),
    ...(currenciesAccepted && { currenciesAccepted }),
    ...(areaServed && { areaServed }),
    ...(hasOfferCatalog && {
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: hasOfferCatalog.name,
        itemListElement: hasOfferCatalog.itemList.map(item => ({
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: item.name,
            ...(item.description && { description: item.description }),
          },
          ...(item.price && { price: item.price }),
          ...(item.priceCurrency && { priceCurrency: item.priceCurrency }),
        })),
      },
    }),
    ...(aggregateRating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: aggregateRating.ratingValue,
        reviewCount: aggregateRating.reviewCount,
      },
    }),
    ...(review && {
      review: review.map(r => ({
        '@type': 'Review',
        author: { '@type': 'Person', name: r.author },
        datePublished: r.datePublished,
        reviewBody: r.reviewBody,
        reviewRating: {
          '@type': 'Rating',
          ratingValue: r.reviewRating,
        },
      })),
    }),
  };

  return <SchemaInjector schema={schema} />;
}
