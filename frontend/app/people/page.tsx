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
import './people.css';

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

interface Profile {
  slug: string;
  name: string;
  headline: string;
  industry: string;
  location: string;
  trustScore: number;
  badges: string[];
}

// Fetch featured profiles from API
async function getFeaturedProfiles(): Promise<Profile[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/people/featured`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function PeoplePage() {
  const featuredProfiles = await getFeaturedProfiles();
  const baseUrl = SITE_CONFIG.baseUrl;

  return (
    <>
      <BreadcrumbSchema items={[{ name: 'People', url: `${baseUrl}/people` }]} />
      <CollectionPageSchema
        name="Muslim Professionals Directory"
        description="Discover verified Muslim professionals across industries"
        url={`${baseUrl}/people`}
        items={featuredProfiles.map(profile => ({
          name: profile.name,
          url: `${baseUrl}/people/${profile.slug}`,
          description: profile.headline,
        }))}
      />

      <main className="people-directory">
        {/* Hero Section */}
        <section className="directory-hero">
          <div className="container">
            <h1>Muslim Professionals Network</h1>
            <p className="lead">
              Discover talented professionals in our community. Connect with mentors, 
              collaborators, and industry leaders.
            </p>
            
            {/* Search */}
            <div className="search-bar">
              <input
                type="search"
                placeholder="Search by name, skill, or company..."
                className="search-input"
              />
              <button className="btn btn-primary">Search</button>
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="directory-filters">
          <div className="container">
            <div className="filter-bar">
              <select className="filter-select">
                {industries.map(industry => (
                  <option key={industry} value={industry}>{industry}</option>
                ))}
              </select>
              
              <select className="filter-select">
                <option>All Locations</option>
                <option>London</option>
                <option>Manchester</option>
                <option>Birmingham</option>
              </select>
              
              <select className="filter-select">
                <option>Sort by: Trust Score</option>
                <option>Sort by: Recently Joined</option>
                <option>Sort by: Name</option>
              </select>
            </div>
          </div>
        </section>

        {/* Featured Profiles */}
        <section className="featured-profiles">
          <div className="container">
            <h2>Featured Professionals</h2>
            
            {featuredProfiles.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">👥</div>
                <h3>No profiles yet</h3>
                <p>Be the first to join MuslimEEN and build your professional profile!</p>
                <Link href="/register" className="btn btn-primary">
                  Create Your Profile
                </Link>
              </div>
            ) : (
              <div className="profiles-grid">
                {featuredProfiles.map((profile) => (
                  <ProfileCard key={profile.slug} profile={profile} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Pagination */}
        {featuredProfiles.length > 0 && (
          <section className="pagination">
            <div className="container">
              <div className="pagination-controls">
                <button className="btn btn-outline" disabled>Previous</button>
                <span className="page-info">Page 1 of 1</span>
                <button className="btn btn-outline" disabled>Next</button>
              </div>
            </div>
          </section>
        )}
      </main>
    </>
  );
}

// Profile Card Component
function ProfileCard({ profile }: { profile: Profile }) {
  return (
    <article className="profile-card">
      <Link href={`/people/${profile.slug}`}>
        <div className="profile-header">
          <div className="profile-avatar">
            {profile.name?.charAt(0) || '?'}
          </div>
          <div className="profile-badges">
            {profile.badges?.map((badge: string) => (
              <span key={badge} className={`badge badge-${badge}`} />
            ))}
          </div>
        </div>
        
        <h3 className="profile-name">{profile.name}</h3>
        <p className="profile-headline">{profile.headline}</p>
        
        <div className="profile-meta">
          <span className="profile-industry">{profile.industry}</span>
          <span className="profile-location">{profile.location}</span>
        </div>
        
        <div className="profile-trust">
          <span className="trust-score">Trust: {profile.trustScore}</span>
        </div>
      </Link>
    </article>
  );
}
