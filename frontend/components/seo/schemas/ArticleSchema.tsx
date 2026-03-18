/**
 * Article Schema Component
 * 
 * For blog posts, news articles, and content pages.
 * Helps Google display article rich snippets with images, dates, and author info.
 * 
 * @see https://schema.org/Article
 * @see https://schema.org/BlogPosting
 */

import SchemaInjector from '@/components/seo/SchemaInjector';

type ArticleType = 'Article' | 'BlogPosting' | 'NewsArticle';

interface ArticleSchemaProps {
  type?: ArticleType;
  headline: string;
  description: string;
  image: string | string[];
  author: {
    name: string;
    url?: string;
    image?: string;
  };
  publisher?: {
    '@type': 'Organization';
    name: string;
    logo: {
      '@type': 'ImageObject';
      url: string;
    };
  };
  datePublished: string;
  dateModified?: string;
  url: string;
  keywords?: string[];
  articleSection?: string;
  wordCount?: number;
  inLanguage?: string;
}

/**
 * Article Schema Component
 * 
 * Usage:
 * ```tsx
 * <ArticleSchema
 *   headline="Understanding Zakat: A Complete Guide"
 *   description="Learn how to calculate Zakat on your assets..."
 *   author={{ name: 'Dr. Ahmed Hassan' }}
 *   datePublished="2026-01-15"
 *   url="https://muslimeen.space/blog/zakat-guide"
 *   image="/images/zakat-guide.jpg"
 * />
 * ```
 */
export default function ArticleSchema({
  type = 'Article',
  headline,
  description,
  image,
  author,
  publisher,
  datePublished,
  dateModified,
  url,
  keywords,
  articleSection,
  wordCount,
  inLanguage = 'en',
}: ArticleSchemaProps) {
  const images = Array.isArray(image) ? image : [image];

  const schema: {
    '@context': 'https://schema.org';
    '@type': string;
    headline: string;
    description: string;
    image: string[];
    author: {
      '@type': 'Person' | 'Organization';
      name: string;
      url?: string;
      image?: string;
    };
    publisher: {
      '@type': 'Organization';
      name: string;
      logo: {
        '@type': 'ImageObject';
        url: string;
      };
    };
    datePublished: string;
    dateModified?: string;
    url: string;
    keywords?: string;
    articleSection?: string;
    wordCount?: number;
    inLanguage: string;
    mainEntityOfPage: {
      '@type': 'WebPage';
      '@id': string;
    };
  } = {
    '@context': 'https://schema.org',
    '@type': type,
    headline,
    description,
    image: images,
    author: {
      '@type': 'Person',
      name: author.name,
      ...(author.url && { url: author.url }),
      ...(author.image && { image: author.image }),
    },
    publisher: publisher ?? {
      '@type': 'Organization' as const,
      name: 'MuslimEEN',
      logo: {
        '@type': 'ImageObject' as const,
        url: 'https://muslimeen.space/logo.png',
      },
    },
    datePublished,
    ...(dateModified && { dateModified }),
    url,
    ...(keywords && { keywords: keywords.join(', ') }),
    ...(articleSection && { articleSection }),
    ...(wordCount && { wordCount }),
    inLanguage,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
  };

  return <SchemaInjector schema={schema} />;
}

/**
 * CollectionPage Schema for directory/listing pages
 * 
 * @see https://schema.org/CollectionPage
 */
interface CollectionPageSchemaProps {
  name: string;
  description: string;
  url: string;
  items: Array<{
    name: string;
    url: string;
    description?: string;
    image?: string;
  }>;
}

export function CollectionPageSchema({
  name,
  description,
  url,
  items,
}: CollectionPageSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description,
    url,
    hasPart: items.map(item => ({
      '@type': 'ListItem',
      name: item.name,
      url: item.url,
      ...(item.description && { description: item.description }),
      ...(item.image && { image: item.image }),
    })),
  };

  return <SchemaInjector schema={schema} />;
}

/**
 * ItemList Schema for ordered/unordered lists
 * 
 * @see https://schema.org/ItemList
 */
interface ItemListSchemaProps {
  items: Array<{
    name: string;
    description?: string;
    url?: string;
    position?: number;
  }>;
  itemListOrder?: 'Ascending' | 'Descending' | 'Unordered';
}

export function ItemListSchema({
  items,
  itemListOrder = 'Unordered',
}: ItemListSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListOrder,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: item.position || index + 1,
      name: item.name,
      ...(item.description && { description: item.description }),
      ...(item.url && { url: item.url }),
    })),
  };

  return <SchemaInjector schema={schema} />;
}
