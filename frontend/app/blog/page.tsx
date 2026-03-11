/**
 * Blog Index Page - Server Component
 * 
 * Content marketing hub for MuslimEEN.
 * Features articles on Islamic finance, professional development, and community topics.
 * 
 * @see SEO_IMPLEMENTATION_PLAN.md - Content Marketing
 */

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { generatePageMetadata, SITE_CONFIG } from '@/lib/seo/metadata';
import { BreadcrumbSchema, CollectionPageSchema } from '@/components/seo';

export const metadata: Metadata = generatePageMetadata({
  title: 'Blog - Islamic Finance & Professional Development',
  description: 'Insights on Islamic finance, Muslim professional growth, halal investing, and community building. Expert articles from MuslimEEN.',
  path: '/blog',
  keywords: [
    'Islamic finance blog',
    'Muslim professional development',
    'halal investing guide',
    'Islamic career advice',
    'Muslim entrepreneurship',
  ],
});

// Blog posts data - in production, fetch from CMS or API
const blogPosts = [
  {
    slug: 'understanding-zakat-complete-guide',
    title: 'Understanding Zakat: A Complete Guide for Muslims',
    excerpt: 'Learn how to calculate Zakat on your assets including cash, gold, investments, and business inventory. Includes step-by-step calculation examples.',
    author: 'Dr. Ahmed Hassan',
    authorTitle: 'Islamic Finance Scholar',
    date: '2026-03-01',
    readTime: '12 min read',
    category: 'Islamic Finance',
    image: '/blog/zakat-guide.jpg',
    featured: true,
  },
  {
    slug: 'networking-muslim-professionals',
    title: 'The Art of Networking for Muslim Professionals',
    excerpt: 'Building professional connections within the Islamic framework. Tips for effective networking while maintaining Islamic values and etiquette.',
    author: 'Amina Patel',
    authorTitle: 'Career Coach',
    date: '2026-02-28',
    readTime: '8 min read',
    category: 'Career Development',
    image: '/blog/networking.jpg',
    featured: false,
  },
  {
    slug: 'halal-investment-options-2026',
    title: 'Halal Investment Options in 2026',
    excerpt: 'A comprehensive overview of Shariah-compliant investment opportunities including stocks, real estate, and Islamic funds.',
    author: 'Yusuf Ibrahim',
    authorTitle: 'Investment Analyst',
    date: '2026-02-25',
    readTime: '15 min read',
    category: 'Investing',
    image: '/blog/investing.jpg',
    featured: false,
  },
  {
    slug: 'building-trust-score-muslimeen',
    title: 'How to Build Your Trust Score on MuslimEEN',
    excerpt: 'Maximize your visibility and credibility on MuslimEEN with these proven strategies for building your trust score.',
    author: 'MuslimEEN Team',
    authorTitle: 'Community Team',
    date: '2026-02-20',
    readTime: '6 min read',
    category: 'Platform Guide',
    image: '/blog/trust-score.jpg',
    featured: false,
  },
  {
    slug: 'islamic-workplace-ethics',
    title: 'Islamic Workplace Ethics: A Modern Guide',
    excerpt: 'Applying Islamic principles to modern workplace challenges including honesty, integrity, and professional conduct.',
    author: 'Dr. Omar Farooq',
    authorTitle: 'Islamic Scholar',
    date: '2026-02-15',
    readTime: '10 min read',
    category: 'Professional Ethics',
    image: '/blog/ethics.jpg',
    featured: false,
  },
  {
    slug: 'freelancing-halal-way',
    title: 'Freelancing the Halal Way: A Beginner\'s Guide',
    excerpt: 'Starting your freelance career while ensuring all your income sources are Shariah-compliant.',
    author: 'Fatima Al-Zahra',
    authorTitle: 'Freelance Consultant',
    date: '2026-02-10',
    readTime: '9 min read',
    category: 'Entrepreneurship',
    image: '/blog/freelancing.jpg',
    featured: false,
  },
];

const categories = [
  'All',
  'Islamic Finance',
  'Career Development',
  'Investing',
  'Platform Guide',
  'Professional Ethics',
  'Entrepreneurship',
];

interface BlogCardProps {
  post: typeof blogPosts[0];
  featured?: boolean;
}

function BlogCard({ post, featured = false }: BlogCardProps) {
  if (featured) {
    return (
      <article className="blog-card featured">
        <div className="featured-image">
          <div className="image-placeholder large">
            <span>📷</span>
          </div>
          <span className="featured-badge">Featured</span>
        </div>
        <div className="featured-content">
          <span className="category-badge">{post.category}</span>
          <h2>
            <Link href={`/blog/${post.slug}`}>{post.title}</Link>
          </h2>
          <p className="excerpt">{post.excerpt}</p>
          <div className="meta">
            <span className="author">{post.author}</span>
            <span className="date">{new Date(post.date).toLocaleDateString()}</span>
            <span className="read-time">{post.readTime}</span>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="blog-card">
      <div className="card-image">
        <div className="image-placeholder">
          <span>📷</span>
        </div>
      </div>
      <div className="card-content">
        <span className="category-badge">{post.category}</span>
        <h3>
          <Link href={`/blog/${post.slug}`}>{post.title}</Link>
        </h3>
        <p className="excerpt">{post.excerpt}</p>
        <div className="meta">
          <span className="author">{post.author}</span>
          <span className="date">{new Date(post.date).toLocaleDateString()}</span>
          <span className="read-time">{post.readTime}</span>
        </div>
      </div>
    </article>
  );
}

export default function BlogPage() {
  const baseUrl = SITE_CONFIG.baseUrl;
  const featuredPost = blogPosts.find(post => post.featured);
  const regularPosts = blogPosts.filter(post => !post.featured);

  return (
    <>
      {/* Breadcrumb Schema */}
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: baseUrl },
          { name: 'Blog', url: `${baseUrl}/blog` },
        ]}
      />

      {/* CollectionPage Schema */}
      <CollectionPageSchema
        name="MuslimEEN Blog"
        description="Insights on Islamic finance, Muslim professional growth, halal investing, and community building."
        url={`${baseUrl}/blog`}
        items={blogPosts.map(post => ({
          name: post.title,
          url: `${baseUrl}/blog/${post.slug}`,
          description: post.excerpt,
        }))}
      />

      <main className="blog-page">
        <div className="container">
          {/* Header */}
          <header className="blog-header" aria-labelledby="blog-heading">
            <h1 id="blog-heading">MuslimEEN Blog</h1>
            <p className="lead">
              Insights on Islamic finance, professional growth, and community building
            </p>
          </header>

          {/* Category Filter */}
          <nav className="category-filter" aria-label="Blog categories">
            {categories.map((category) => (
              <Link
                key={category}
                href={category === 'All' ? '/blog' : `/blog/category/${category.toLowerCase()}`}
                className="category-link"
              >
                {category}
              </Link>
            ))}
          </nav>

          {/* Featured Post */}
          {featuredPost && (
            <section className="featured-section" aria-labelledby="featured-heading">
              <h2 id="featured-heading" className="visually-hidden">Featured Article</h2>
              <BlogCard post={featuredPost} featured />
            </section>
          )}

          {/* Posts Grid */}
          <section className="posts-section" aria-labelledby="posts-heading">
            <h2 id="posts-heading" className="section-title">Latest Articles</h2>
            <div className="posts-grid">
              {regularPosts.map((post) => (
                <BlogCard key={post.slug} post={post} />
              ))}
            </div>
          </section>

          {/* Newsletter CTA */}
          <section className="newsletter-section" aria-labelledby="newsletter-heading">
            <div className="newsletter-content">
              <h2 id="newsletter-heading">Stay Informed</h2>
              <p>Get the latest articles on Islamic finance and professional development delivered to your inbox.</p>
              <form className="newsletter-form">
                <label htmlFor="email" className="visually-hidden">Email address</label>
                <input
                  type="email"
                  id="email"
                  placeholder="Enter your email"
                  className="form-input"
                />
                <button type="submit" className="btn btn-primary">
                  Subscribe
                </button>
              </form>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
