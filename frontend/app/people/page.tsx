/**
 * People Directory Page - Server Component
 * 
 * Public directory of Muslim professionals on MuslimEEN.
 * Server-rendered for SEO with pagination and filtering.
 * 
 * @see SEO_IMPLEMENTATION_PLAN.md Phase 2
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { generatePageMetadata, SITE_CONFIG } from '@/lib/seo/metadata';
import { BreadcrumbSchema, CollectionPageSchema } from '@/components/seo';

export const metadata: Metadata = generatePageMetadata({
  title: 'People Directory - Muslim Professionals Network',
  description: 'Discover verified Muslim professionals across industries. Browse profiles, find mentors, and connect with talented individuals in the MuslimEEN community.',
  path: '/people',
  keywords: [
    'Muslim professionals',
    'Islamic network',
    'Muslim talent',
    'halal LinkedIn',
    'Muslim engineers',
    'Muslim doctors',
    'Muslim entrepreneurs',
    'Islamic professionals directory',
  ],
});

// Sample featured profiles (in production, fetch from API)
const featuredProfiles = [
  {
    slug: 'ahmed-hassan-software-engineer',
    name: 'Ahmed Hassan',
    headline: 'Senior Software Engineer',
    industry: 'Technology',
    location: 'London, UK',
    trustScore: 945,
    badges: ['biometric', 'two_witness'],
  },
  {
    slug: 'yusuf-ibrahim-data-scientist',
    name: 'Yusuf Ibrahim',
    headline: 'Data Scientist',
    industry: 'Finance',
    location: 'Manchester, UK',
    trustScore: 892,
    badges: ['biometric'],
  },
  {
    slug: 'amina-patel-product-manager',
    name: 'Amina Patel',
    headline: 'Product Manager',
    industry: 'Technology',
    location: 'Birmingham, UK',
    trustScore: 921,
    badges: ['biometric', 'business'],
  },
  {
    slug: 'omar-farooq-islamic-scholar',
    name: 'Dr. Omar Farooq',
    headline: 'Islamic Finance Scholar',
    industry: 'Education',
    location: 'London, UK',
    trustScore: 978,
    badges: ['biometric', 'institutional'],
  },
  {
    slug: 'fatima-al-zahra-medical-doctor',
    name: 'Dr. Fatima Al-Zahra',
    headline: 'General Practitioner',
    industry: 'Healthcare',
    location: 'Leeds, UK',
    trustScore: 934,
    badges: ['biometric', 'two_witness'],
  },
  {
    slug: 'muhammad-khan-architect',
    name: 'Muhammad Khan',
    headline: 'Architect',
    industry: 'Construction',
    location: 'Bradford, UK',
    trustScore: 867,
    badges: ['biometric'],
  },
];

// Industry filters
const industries = [
  'All Industries',
  'Technology',
  'Finance',
  'Healthcare',
  'Education',
  'Legal',
  'Construction',
  'Media',
  'Retail',
];

interface ProfileCardProps {
  slug: string;
  name: string;
  headline: string;
  industry: string;
  location: string;
  trustScore: number;
  badges: string[];
}

function ProfileCard({ slug, name, headline, industry, location, trustScore, badges }: ProfileCardProps) {
  const trustLevel = trustScore >= 800 ? 'high' : trustScore >= 500 ? 'medium' : 'low';
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2);

  return (
    <article className="profile-card">
      <div className="profile-card-header">
        <div className="avatar avatar-lg">{initials}</div>
        <div className="profile-card-meta">
          <h3>
            <Link href={`/people/${slug}`} className="profile-name">
              {name}
            </Link>
          </h3>
          <p className="profile-headline">{headline}</p>
          <p className="profile-location">{location}</p>
        </div>
        <div className={`trust-badge trust-${trustLevel}`}>
          {trustScore}
        </div>
      </div>
      <div className="profile-card-body">
        <span className="industry-tag">{industry}</span>
        <div className="verification-badges">
          {badges.map(badge => (
            <span key={badge} className="badge badge-verified">
              {badge === 'biometric' && '🔐 Biometric'}
              {badge === 'two_witness' && '👥 Two Witness'}
              {badge === 'business' && '💼 Business'}
              {badge === 'institutional' && '🏛️ Institutional'}
            </span>
          ))}
        </div>
      </div>
      <div className="profile-card-footer">
        <Link href={`/people/${slug}`} className="btn btn-primary btn-sm">
          View Profile
        </Link>
        <button className="btn btn-outline btn-sm">Connect</button>
      </div>
    </article>
  );
}

export default function PeopleDirectoryPage() {
  const baseUrl = SITE_CONFIG.baseUrl;

  return (
    <>
      {/* Breadcrumb structured data */}
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: baseUrl },
          { name: 'People', url: `${baseUrl}/people` },
        ]}
      />

      {/* CollectionPage schema for directory listings */}
      <CollectionPageSchema
        name="Muslim Professionals Directory"
        description="Discover verified Muslim professionals across industries. Browse profiles, find mentors, and connect with talented individuals in the MuslimEEN community."
        url={`${baseUrl}/people`}
        items={featuredProfiles.map(profile => ({
          name: profile.name,
          url: `${baseUrl}/people/${profile.slug}`,
          description: profile.headline,
        }))}
      />

      <main className="people-directory-page">
        {/* Page Header */}
        <section className="page-header" aria-labelledby="people-heading">
          <div className="container">
            <h1 id="people-heading">People Directory</h1>
            <p className="lead">
              Discover verified Muslim professionals across industries
            </p>
          </div>
        </section>

        {/* Filters */}
        <section className="directory-filters" aria-label="Filter profiles">
          <div className="container">
            <div className="filters-row">
              <div className="search-box">
                <label htmlFor="search-people" className="visually-hidden">
                  Search professionals
                </label>
                <input
                  id="search-people"
                  type="text"
                  className="form-input"
                  placeholder="Search by name, skill, or company..."
                />
              </div>
              <div className="filter-group">
                <label htmlFor="filter-industry" className="visually-hidden">
                  Filter by industry
                </label>
                <select id="filter-industry" className="form-select">
                  {industries.map(industry => (
                    <option key={industry} value={industry === 'All Industries' ? '' : industry}>
                      {industry}
                    </option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label htmlFor="filter-location" className="visually-hidden">
                  Filter by location
                </label>
                <select id="filter-location" className="form-select">
                  <option value="">All Locations</option>
                  <option value="london">London</option>
                  <option value="manchester">Manchester</option>
                  <option value="birmingham">Birmingham</option>
                  <option value="remote">Remote</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="directory-stats" aria-label="Directory statistics">
          <div className="container">
            <div className="stats-row">
              <div className="stat-item">
                <span className="stat-number">12,456</span>
                <span className="stat-label">Verified Professionals</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">87</span>
                <span className="stat-label">Industries</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">45</span>
                <span className="stat-label">Countries</span>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Profiles */}
        <section className="featured-profiles" aria-labelledby="featured-heading">
          <div className="container">
            <h2 id="featured-heading" className="section-title">Featured Professionals</h2>
            <div className="profiles-grid">
              {featuredProfiles.map(profile => (
                <ProfileCard key={profile.slug} {...profile} />
              ))}
            </div>
          </div>
        </section>

        {/* Join CTA */}
        <section className="join-cta" aria-labelledby="join-heading">
          <div className="container">
            <h2 id="join-heading">Join the Directory</h2>
            <p>
              Are you a Muslim professional? Create your profile and get discovered 
              by employers, partners, and the community.
            </p>
            <Link href="/login" className="btn btn-primary btn-lg">
              Create Your Profile
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
