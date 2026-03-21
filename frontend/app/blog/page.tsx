/**
 * Blog Index Page - Server Component
 * 
 * Central hub for Islamic lifestyle, business, and community content.
 * Server-rendered for optimal SEO performance.
 * 
 * @see SEO_IMPLEMENTATION_PLAN.md Phase 2
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { generatePageMetadata, SITE_CONFIG } from '@/lib/seo/metadata';
import { BreadcrumbSchema, CollectionPageSchema } from '@/components/seo';
import './blog.css';

export const metadata: Metadata = generatePageMetadata({
  title: 'MuslimEEN Blog - Islamic Lifestyle, Business & Community',
  description: 'Discover articles on halal living, Islamic business ethics, community building, and Muslim lifestyle. Expert insights for the modern Muslim professional.',
  path: '/blog',
  keywords: [
    'Islamic blog',
    'halal lifestyle',
    'Muslim business',
    'Islamic finance',
    'Muslim community',
    'Islamic lifestyle tips',
  ],
});

// Blog categories
const categories = [
  { id: 'all', name: 'All Posts' },
  { id: 'faith', name: 'Faith & Spirituality' },
  { id: 'business', name: 'Business & Finance' },
  { id: 'lifestyle', name: 'Lifestyle' },
  { id: 'community', name: 'Community' },
  { id: 'technology', name: 'Technology' },
];

// Fetch blog posts from API
async function getBlogPosts(): Promise<BlogPost[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/blog/posts`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  category?: string;
  readTime?: string;
}

export default async function BlogPage() {
  const blogPosts = await getBlogPosts();
  const baseUrl = SITE_CONFIG.baseUrl;

  return (
    <>
      <BreadcrumbSchema items={[{ name: 'Blog', url: `${baseUrl}/blog` }]} />
      <CollectionPageSchema
        name="MuslimEEN Blog"
        description="Islamic lifestyle, business ethics, and community insights"
        url={`${baseUrl}/blog`}
        items={blogPosts.map(post => ({
          name: post.title,
          url: `${baseUrl}/blog/${post.slug}`,
          description: post.excerpt,
        }))}
      />

      <main className="blog-index">
        {/* Hero Section */}
        <section className="blog-hero">
          <div className="blog-hero-content">
            <h1>MuslimEEN Blog</h1>
            <p className="lead">
              Insights on Islamic business, halal living, and building 
              a thriving Muslim community
            </p>
          </div>
        </section>

        {/* Category Navigation */}
        <section className="blog-categories">
          <div className="container">
            <nav className="category-nav">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={cat.id === 'all' ? '/blog' : `/blog/category/${cat.id}`}
                  className={`category-link ${cat.id === 'all' ? 'active' : ''}`}
                >
                  {cat.name}
                </Link>
              ))}
            </nav>
          </div>
        </section>

        {/* Featured Post */}
        {blogPosts.length > 0 && (
          <section className="featured-post">
            <div className="container">
              <article className="featured-post-card">
                <div className="featured-post-image">
                  <div className="placeholder-image featured-image">
                    <span>Featured Article</span>
                  </div>
                </div>
                <div className="featured-post-content">
                  <span className="post-category">Featured</span>
                  <h2>
                    <Link href={`/blog/${blogPosts[0].slug}`}>
                      {blogPosts[0].title}
                    </Link>
                  </h2>
                  <p className="post-excerpt">{blogPosts[0].excerpt}</p>
                  <div className="post-meta">
                    <span className="post-author">{blogPosts[0].author}</span>
                    <span className="post-date">
                      {new Date(blogPosts[0].date).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="post-read-time">{blogPosts[0].readTime || '5 min read'}</span>
                  </div>
                </div>
              </article>
            </div>
          </section>
        )}

        {/* Blog Posts Grid */}
        <section className="blog-posts">
          <div className="container">
            <div className="section-header">
              <h2>Latest Articles</h2>
            </div>

            {blogPosts.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📝</div>
                <h3>No articles yet</h3>
                <p>Check back soon for insightful articles on Islamic business and lifestyle!</p>
              </div>
            ) : (
              <div className="posts-grid">
                {blogPosts.map((post) => (
                  <article key={post.slug} className="post-card">
                    <div className="post-image">
                      <div className="placeholder-image">
                        <span>Article Image</span>
                      </div>
                    </div>
                    <div className="post-card-content">
                      <span className="post-category">{post.category || 'General'}</span>
                      <h3>
                        <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                      </h3>
                      <p className="post-excerpt">{post.excerpt}</p>
                      <div className="post-meta">
                        <span className="post-author">{post.author}</span>
                        <span className="post-date">
                          {new Date(post.date).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Newsletter CTA */}
        <section className="blog-newsletter">
          <div className="container">
            <div className="newsletter-card">
              <div className="newsletter-content">
                <h2>Stay Updated</h2>
                <p>Get the latest articles delivered to your inbox weekly</p>
              </div>
              <form className="newsletter-form">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="newsletter-input"
                  required
                />
                <button type="submit" className="btn btn-primary">
                  Subscribe
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
