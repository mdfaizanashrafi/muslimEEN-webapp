/**
 * Video Schema Component
 * 
 * For video content, enabling rich video results in Google search.
 * Supports embedded videos and video galleries.
 * 
 * @see https://schema.org/VideoObject
 */

import SchemaInjector from '@/components/seo/SchemaInjector';

interface VideoSchemaProps {
  name: string;
  description: string;
  thumbnailUrl: string | string[];
  contentUrl?: string;
  embedUrl?: string;
  uploadDate: string;
  duration?: string; // ISO 8601 duration format (e.g., "PT2M30S")
  author?: {
    name: string;
    url?: string;
  };
  publisher?: {
    name: string;
    logo: string;
  };
  interactionStatistic?: {
    userInteractionCount: number;
    interactionType: 'WatchAction' | 'LikeAction' | 'CommentAction';
  };
  expires?: string;
}

/**
 * Video Schema Component
 * 
 * Usage:
 * ```tsx
 * <VideoSchema
 *   name="Understanding Zakat: Complete Guide"
 *   description="Learn how to calculate Zakat..."
 *   thumbnailUrl="/thumbnails/zakat-guide.jpg"
 *   uploadDate="2026-01-15"
 *   duration="PT15M30S"
 * />
 * ```
 */
export default function VideoSchema({
  name,
  description,
  thumbnailUrl,
  contentUrl,
  embedUrl,
  uploadDate,
  duration,
  author,
  publisher,
  interactionStatistic,
  expires,
}: VideoSchemaProps) {
  const thumbnails = Array.isArray(thumbnailUrl) ? thumbnailUrl : [thumbnailUrl];

  const schema: {
    '@context': 'https://schema.org';
    '@type': 'VideoObject';
    name: string;
    description: string;
    thumbnailUrl: string[];
    uploadDate: string;
    duration?: string;
    contentUrl?: string;
    embedUrl?: string;
    author?: {
      '@type': 'Person' | 'Organization';
      name: string;
      url?: string;
    };
    publisher?: {
      '@type': 'Organization';
      name: string;
      logo: {
        '@type': 'ImageObject';
        url: string;
      };
    };
    interactionStatistic?: {
      '@type': 'InteractionCounter';
      userInteractionCount: number;
      interactionType: {
        '@type': string;
      };
    };
    expires?: string;
  } = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name,
    description,
    thumbnailUrl: thumbnails,
    uploadDate,
    ...(duration && { duration }),
    ...(contentUrl && { contentUrl }),
    ...(embedUrl && { embedUrl }),
    ...(author && {
      author: {
        '@type': 'Person',
        name: author.name,
        ...(author.url && { url: author.url }),
      },
    }),
    ...(publisher && {
      publisher: {
        '@type': 'Organization',
        name: publisher.name,
        logo: {
          '@type': 'ImageObject',
          url: publisher.logo,
        },
      },
    }),
    ...(interactionStatistic && {
      interactionStatistic: {
        '@type': 'InteractionCounter',
        userInteractionCount: interactionStatistic.userInteractionCount,
        interactionType: {
          '@type': interactionStatistic.interactionType,
        },
      },
    }),
    ...(expires && { expires }),
  };

  return <SchemaInjector schema={schema} />;
}

/**
 * Video Gallery Schema for multiple videos
 */
interface VideoGallerySchemaProps {
  videos: Array<{
    name: string;
    description: string;
    thumbnailUrl: string;
    uploadDate: string;
    duration?: string;
    url: string;
  }>;
}

export function VideoGallerySchema({ videos }: VideoGallerySchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: videos.map((video, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'VideoObject',
        name: video.name,
        description: video.description,
        thumbnailUrl: video.thumbnailUrl,
        uploadDate: video.uploadDate,
        ...(video.duration && { duration: video.duration }),
        url: video.url,
      },
    })),
  };

  return <SchemaInjector schema={schema} />;
}
