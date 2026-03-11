/**
 * Event Schema Component
 * 
 * For conferences, webinars, meetups, and community events.
 * Enables rich event results with dates, locations, and booking links.
 * 
 * @see https://schema.org/Event
 */

import SchemaInjector from '@/components/seo/SchemaInjector';

type EventStatus = 'EventScheduled' | 'EventPostponed' | 'EventCancelled' | 'EventMovedOnline';
type EventAttendanceMode = 'OfflineEventAttendanceMode' | 'OnlineEventAttendanceMode' | 'MixedEventAttendanceMode';

interface EventSchemaProps {
  name: string;
  description: string;
  startDate: string; // ISO 8601 format
  endDate?: string;
  eventStatus?: EventStatus;
  eventAttendanceMode?: EventAttendanceMode;
  location?: {
    name?: string;
    address?: string;
    city: string;
    country: string;
  } | {
    url: string; // For online events
  };
  image?: string | string[];
  organizer: {
    name: string;
    url?: string;
  };
  performer?: Array<{
    name: string;
    type: 'Person' | 'PerformingGroup';
  }>;
  offers?: {
    url: string;
    price: string;
    priceCurrency: string;
    availability?: 'InStock' | 'SoldOut' | 'PreOrder';
    validFrom?: string;
  };
  maximumAttendeeCapacity?: number;
  isAccessibleForFree?: boolean;
}

/**
 * Event Schema Component
 * 
 * Usage:
 * ```tsx
 * <EventSchema
 *   name="Muslim Tech Conference 2026"
 *   description="Annual gathering of Muslim tech professionals..."
 *   startDate="2026-06-15T09:00:00"
 *   endDate="2026-06-17T18:00:00"
 *   location={{ city: 'London', country: 'UK' }}
 *   organizer={{ name: 'MuslimEEN' }}
 * />
 * ```
 */
export default function EventSchema({
  name,
  description,
  startDate,
  endDate,
  eventStatus = 'EventScheduled',
  eventAttendanceMode = 'OfflineEventAttendanceMode',
  location,
  image,
  organizer,
  performer,
  offers,
  maximumAttendeeCapacity,
  isAccessibleForFree,
}: EventSchemaProps) {
  const images = image ? (Array.isArray(image) ? image : [image]) : undefined;

  const schema: {
    '@context': 'https://schema.org';
    '@type': 'Event';
    name: string;
    description: string;
    startDate: string;
    endDate?: string;
    eventStatus: string;
    eventAttendanceMode: string;
    location: {
      '@type': 'Place' | 'VirtualLocation';
      name?: string;
      address?: {
        '@type': 'PostalAddress';
        addressLocality: string;
        addressCountry: string;
        streetAddress?: string;
      };
      url?: string;
    };
    image?: string[];
    organizer: {
      '@type': 'Organization';
      name: string;
      url?: string;
    };
    performer?: Array<{
      '@type': 'Person' | 'PerformingGroup';
      name: string;
    }>;
    offers?: {
      '@type': 'Offer';
      url: string;
      price: string;
      priceCurrency: string;
      availability?: string;
      validFrom?: string;
    };
    maximumAttendeeCapacity?: number;
    isAccessibleForFree?: boolean;
  } = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name,
    description,
    startDate,
    ...(endDate && { endDate }),
    eventStatus: `https://schema.org/${eventStatus}`,
    eventAttendanceMode: `https://schema.org/${eventAttendanceMode}`,
    location: 'url' in (location || {})
      ? {
          '@type': 'VirtualLocation',
          url: (location as { url: string }).url,
        }
      : {
          '@type': 'Place',
          ...(location?.name && { name: location.name }),
          address: {
            '@type': 'PostalAddress',
            addressLocality: location?.city || '',
            addressCountry: location?.country || '',
            ...(location?.address && { streetAddress: location.address }),
          },
        },
    ...(images && { image: images }),
    organizer: {
      '@type': 'Organization',
      name: organizer.name,
      ...(organizer.url && { url: organizer.url }),
    },
    ...(performer && {
      performer: performer.map(p => ({
        '@type': p.type,
        name: p.name,
      })),
    }),
    ...(offers && {
      offers: {
        '@type': 'Offer',
        url: offers.url,
        price: offers.price,
        priceCurrency: offers.priceCurrency,
        ...(offers.availability && { availability: `https://schema.org/${offers.availability}` }),
        ...(offers.validFrom && { validFrom: offers.validFrom }),
      },
    }),
    ...(maximumAttendeeCapacity && { maximumAttendeeCapacity }),
    ...(isAccessibleForFree !== undefined && { isAccessibleForFree }),
  };

  return <SchemaInjector schema={schema} />;
}

/**
 * Event Series Schema for recurring events
 */
interface EventSeriesSchemaProps {
  name: string;
  description: string;
  events: Array<{
    name: string;
    startDate: string;
    endDate?: string;
    location: {
      city: string;
      country: string;
    };
    url: string;
  }>;
}

export function EventSeriesSchema({ name, description, events }: EventSeriesSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'EventSeries',
    name,
    description,
    subEvents: events.map(event => ({
      '@type': 'Event',
      name: event.name,
      startDate: event.startDate,
      ...(event.endDate && { endDate: event.endDate }),
      location: {
        '@type': 'Place',
        address: {
          '@type': 'PostalAddress',
          addressLocality: event.location.city,
          addressCountry: event.location.country,
        },
      },
      url: event.url,
    })),
  };

  return <SchemaInjector schema={schema} />;
}
