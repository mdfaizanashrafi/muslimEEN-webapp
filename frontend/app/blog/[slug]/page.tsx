/**
 * Blog Post Page - Dynamic Server Component
 * 
 * Individual blog posts with Article schema for rich search results.
 * Supports HowTo schema for guides and tutorials.
 * 
 * @see SEO_IMPLEMENTATION_PLAN.md - Content Marketing
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { generatePageMetadata, SITE_CONFIG } from '@/lib/seo/metadata';
import { 
  ArticleSchema, 
  BreadcrumbSchema, 
  HowToSchema,
  zakatHowTo,
  FAQSchema,
} from '@/components/seo';

// Blog posts data - in production, fetch from CMS
const blogPostsData: Record<string, {
  title: string;
  excerpt: string;
  content: string;
  author: string;
  authorBio: string;
  date: string;
  modifiedDate?: string;
  readTime: string;
  category: string;
  tags: string[];
  image: string;
  useHowToSchema?: boolean;
  howToData?: typeof zakatHowTo;
  faqs?: Array<{ question: string; answer: string }>;
}> = {
  'understanding-zakat-complete-guide': {
    title: 'Understanding Zakat: A Complete Guide for Muslims',
    excerpt: 'Learn how to calculate Zakat on your assets including cash, gold, investments, and business inventory.',
    content: `
      <p>Zakat is one of the Five Pillars of Islam and a fundamental obligation for every Muslim who meets the criteria. This comprehensive guide will walk you through everything you need to know about calculating and paying Zakat.</p>
      
      <h2>What is Zakat?</h2>
      <p>Zakat literally means "purification" and "growth." It is an annual obligation where Muslims who possess wealth above a certain threshold (Nisab) must give 2.5% of their eligible assets to those in need. Zakat purifies your wealth and helps the community.</p>
      
      <h2>Who Must Pay Zakat?</h2>
      <p>Every Muslim who meets the following conditions must pay Zakat:</p>
      <ul>
        <li>Is a free Muslim (not a slave)</li>
        <li>Owns wealth equal to or exceeding the Nisab threshold</li>
        <li>Has possessed this wealth for one lunar year (Hawl)</li>
        <li>The wealth is of a productive nature (can grow or generate returns)</li>
      </ul>
      
      <h2>Assets Subject to Zakat</h2>
      <p>The following assets are generally subject to Zakat:</p>
      <ul>
        <li><strong>Cash:</strong> All forms of money including savings, checking accounts, and foreign currency</li>
        <li><strong>Gold and Silver:</strong> Jewelry, coins, and bullion</li>
        <li><strong>Investments:</strong> Stocks, bonds, and mutual funds (Shariah-compliant)</li>
        <li><strong>Business Inventory:</strong> Goods held for sale</li>
        <li><strong>Money Owed to You:</strong> Loans you expect to collect</li>
      </ul>
      
      <h2>Assets Exempt from Zakat</h2>
      <p>The following are typically not subject to Zakat:</p>
      <ul>
        <li>Your primary residence</li>
        <li>Personal vehicle for transportation</li>
        <li>Furniture and household items</li>
        <li>Clothing for personal use</li>
        <li>Tools of your trade</li>
      </ul>
      
      <h2>The Nisab Threshold</h2>
      <p>Nisab is the minimum amount of wealth that makes Zakat obligatory. It is based on the value of:</p>
      <ul>
        <li><strong>Gold Nisab:</strong> 87.48 grams of gold</li>
        <li><strong>Silver Nisab:</strong> 612.36 grams of silver</li>
      </ul>
      <p>Most scholars recommend using the silver Nisab because it allows more people to fulfill this obligation and help those in need.</p>
      
      <h2>Calculating Your Zakat</h2>
      <p>Follow these steps to calculate your Zakat:</p>
      <ol>
        <li>Add up all your zakatable assets</li>
        <li>Subtract immediate liabilities (debts due now)</li>
        <li>Check if the net amount meets the Nisab threshold</li>
        <li>Calculate 2.5% of the net amount</li>
        <li>Distribute to eligible recipients</li>
      </ol>
      
      <h2>When to Pay Zakat</h2>
      <p>Zakat becomes due after one lunar year (Hawl) of owning wealth above Nisab. Many Muslims choose to pay during Ramadan for increased blessings, but it can be paid anytime once it is due.</p>
      
      <h2>Eligible Recipients</h2>
      <p>The Quran specifies eight categories of eligible Zakat recipients:</p>
      <ol>
        <li>The poor (Fuqara)</li>
        <li>The needy (Masakin)</li>
        <li>Zakat administrators</li>
        <li>Those whose hearts are to be reconciled</li>
        <li>Freeing captives</li>
        <li>The debt-ridden</li>
        <li>In the cause of Allah</li>
        <li>The wayfarer</li>
      </ol>
      
      <h2>Using MuslimEEN for Zakat</h2>
      <p>MuslimEEN connects you with verified Zakat-eligible campaigns and organizations. Our platform ensures your Zakat reaches legitimate recipients while providing transparency and accountability.</p>
    `,
    author: 'Dr. Ahmed Hassan',
    authorBio: 'Dr. Ahmed Hassan is an Islamic finance scholar with over 15 years of experience in Shariah-compliant financial planning. He holds a PhD in Islamic Economics from Al-Azhar University.',
    date: '2026-03-01',
    readTime: '12 min read',
    category: 'Islamic Finance',
    tags: ['zakat', 'islamic finance', 'charity', 'calculation', 'guide'],
    image: '/blog/zakat-guide.jpg',
    useHowToSchema: true,
    howToData: zakatHowTo,
    faqs: [
      {
        question: 'Can I pay Zakat in installments?',
        answer: 'Yes, you can pay Zakat in installments as long as the full amount is paid within the lunar year. However, it is recommended to pay promptly once it is due.',
      },
      {
        question: 'Do I pay Zakat on my retirement account?',
        answer: 'For retirement accounts, opinions vary. Some scholars say Zakat is due on the total amount annually, while others say it is only due when you have access to the funds. Consult a qualified scholar for your specific situation.',
      },
      {
        question: 'What if my wealth fluctuates throughout the year?',
        answer: 'You calculate Zakat based on what you own at the end of your Zakat year (Hawl). If you dip below Nisab during the year but are above it at the end, Zakat is still due.',
      },
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(blogPostsData).map((slug) => ({
    slug,
  }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const post = blogPostsData[params.slug];
  
  if (!post) {
    return {
      title: 'Article Not Found - MuslimEEN Blog',
    };
  }

  return generatePageMetadata({
    title: post.title,
    description: post.excerpt,
    path: `/blog/${params.slug}`,
    type: 'article',
    keywords: post.tags,
    author: post.author,
    publishedAt: post.date,
    modifiedAt: post.modifiedDate,
  });
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = blogPostsData[params.slug];

  if (!post) {
    notFound();
  }

  const baseUrl = SITE_CONFIG.baseUrl;
  const articleUrl = `${baseUrl}/blog/${params.slug}`;

  return (
    <>
      {/* Article Schema */}
      <ArticleSchema
        headline={post.title}
        description={post.excerpt}
        author={{ name: post.author }}
        datePublished={post.date}
        dateModified={post.modifiedDate || post.date}
        url={articleUrl}
        image={`${baseUrl}${post.image}`}
        keywords={post.tags}
        articleSection={post.category}
      />

      {/* HowTo Schema for guides */}
      {post.useHowToSchema && post.howToData && (
        <HowToSchema
          name={post.howToData.name}
          description={post.howToData.description}
          steps={post.howToData.steps}
          totalTime={post.howToData.totalTime}
          supply={post.howToData.supply}
        />
      )}

      {/* FAQ Schema */}
      {post.faqs && <FAQSchema items={post.faqs} />}

      {/* Breadcrumb Schema */}
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: baseUrl },
          { name: 'Blog', url: `${baseUrl}/blog` },
          { name: post.category, url: `${baseUrl}/blog/category/${post.category.toLowerCase()}` },
          { name: post.title },
        ]}
      />

      <article className="blog-post">
        <div className="container">
          {/* Header */}
          <header className="post-header">
            <span className="category-badge">{post.category}</span>
            <h1>{post.title}</h1>
            <p className="excerpt">{post.excerpt}</p>
            
            <div className="post-meta">
              <div className="author-info">
                <div className="author-avatar">{post.author.split(' ').map(n => n[0]).join('')}</div>
                <div className="author-details">
                  <span className="author-name">{post.author}</span>
                  <span className="author-title">{post.authorBio}</span>
                </div>
              </div>
              <div className="post-details">
                <time dateTime={post.date}>
                  {new Date(post.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </time>
                <span className="read-time">{post.readTime}</span>
              </div>
            </div>
          </header>

          {/* Featured Image */}
          <div className="featured-image">
            <div className="image-placeholder large">
              <span>📷 Featured Image</span>
            </div>
          </div>

          {/* Content */}
          <div className="post-content" dangerouslySetInnerHTML={{ __html: post.content }} />

          {/* Tags */}
          <div className="post-tags">
            <span className="tags-label">Tags:</span>
            {post.tags.map((tag) => (
              <Link key={tag} href={`/blog/tag/${tag}`} className="tag-link">
                #{tag}
              </Link>
            ))}
          </div>

          {/* Author Box */}
          <aside className="author-box" aria-labelledby="author-heading">
            <h2 id="author-heading">About the Author</h2>
            <div className="author-content">
              <div className="author-avatar large">
                {post.author.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="author-bio">
                <h3>{post.author}</h3>
                <p>{post.authorBio}</p>
              </div>
            </div>
          </aside>

          {/* Related Posts */}
          <section className="related-posts" aria-labelledby="related-heading">
            <h2 id="related-heading">Related Articles</h2>
            <div className="related-grid">
              <p>Browse more articles in {post.category}</p>
              <Link href={`/blog/category/${post.category.toLowerCase()}`} className="btn btn-outline">
                View All {post.category} Articles
              </Link>
            </div>
          </section>
        </div>
      </article>
    </>
  );
}
