/**
 * Profile Page - Dynamic Server Component
 * 
 * Individual user profiles with SEO-optimized URLs:
 * /people/[name-slug] format for maximum search visibility
 * 
 * Features:
 * - Dynamic metadata based on user profile
 * - Person schema markup for rich results
 * - Breadcrumb navigation
 * - Server-side rendering
 * 
 * @see SEO_IMPLEMENTATION_PLAN.md Phase 2
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import { 
  generateProfileMetadata, 
  generatePageMetadata,
  SITE_CONFIG 
} from '@/lib/seo/metadata';
import { PersonSchema, BreadcrumbSchema } from '@/components/seo';

// In production, fetch from your API/database
interface ProfileData {
  slug: string;
  fullName: string;
  headline: string;
  bio: string;
  industry: string;
  location: string;
  skills: string[];
  trustScore: number;
  verificationLevel: string;
  joinedDate: string;
  avatar?: string;
  company?: string;
  experience: Array<{
    title: string;
    company: string;
    duration: string;
  }>;
  education: Array<{
    degree: string;
    institution: string;
    year: string;
  }>;
}

// Mock profile data - replace with API call in production
const profilesData: Record<string, ProfileData> = {
  'ahmed-hassan-software-engineer': {
    slug: 'ahmed-hassan-software-engineer',
    fullName: 'Ahmed Hassan',
    headline: 'Senior Software Engineer | Full Stack Developer',
    bio: 'Passionate software engineer with 8+ years of experience building scalable web applications. Specializing in React, Node.js, and cloud architecture. Committed to using technology to benefit the Muslim community.',
    industry: 'Technology',
    location: 'London, UK',
    skills: ['React', 'Node.js', 'TypeScript', 'AWS', 'PostgreSQL', 'Next.js'],
    trustScore: 945,
    verificationLevel: 'Fully Verified',
    joinedDate: '2024-01-15',
    company: 'TechCorp Ltd',
    experience: [
      { title: 'Senior Software Engineer', company: 'TechCorp Ltd', duration: '2021 - Present' },
      { title: 'Full Stack Developer', company: 'StartupXYZ', duration: '2018 - 2021' },
      { title: 'Junior Developer', company: 'Digital Agency', duration: '2016 - 2018' },
    ],
    education: [
      { degree: 'MSc Computer Science', institution: 'University of London', year: '2016' },
      { degree: 'BSc Software Engineering', institution: 'University of Manchester', year: '2014' },
    ],
  },
  'yusuf-ibrahim-data-scientist': {
    slug: 'yusuf-ibrahim-data-scientist',
    fullName: 'Yusuf Ibrahim',
    headline: 'Data Scientist | Machine Learning Engineer',
    bio: 'Data scientist specializing in financial modeling and risk analysis. Building AI solutions for Islamic finance applications.',
    industry: 'Finance',
    location: 'Manchester, UK',
    skills: ['Python', 'Machine Learning', 'TensorFlow', 'SQL', 'Data Visualization'],
    trustScore: 892,
    verificationLevel: 'Biometric Verified',
    joinedDate: '2024-03-20',
    company: 'Islamic Finance Bank',
    experience: [
      { title: 'Data Scientist', company: 'Islamic Finance Bank', duration: '2020 - Present' },
      { title: 'Data Analyst', company: 'FinTech Startup', duration: '2017 - 2020' },
    ],
    education: [
      { degree: 'MSc Data Science', institution: 'Imperial College London', year: '2017' },
    ],
  },
  'amina-patel-product-manager': {
    slug: 'amina-patel-product-manager',
    fullName: 'Amina Patel',
    headline: 'Product Manager | Tech Lead',
    bio: 'Product leader with a passion for building user-centric solutions. Currently leading product development for Islamic fintech applications.',
    industry: 'Technology',
    location: 'Birmingham, UK',
    skills: ['Product Management', 'Agile', 'User Research', 'Fintech', 'Strategy'],
    trustScore: 921,
    verificationLevel: 'Business Verified',
    joinedDate: '2024-02-10',
    company: 'MuslimTech Solutions',
    experience: [
      { title: 'Senior Product Manager', company: 'MuslimTech Solutions', duration: '2022 - Present' },
      { title: 'Product Manager', company: 'E-commerce Platform', duration: '2019 - 2022' },
    ],
    education: [
      { degree: 'MBA', institution: 'Warwick Business School', year: '2019' },
    ],
  },
};

/**
 * Generate static params for pre-rendering
 * In production, fetch all profile slugs from your API
 */
export function generateStaticParams() {
  return Object.keys(profilesData).map((slug) => ({
    slug,
  }));
}

/**
 * Generate dynamic metadata for each profile
 * This creates unique titles and descriptions for each profile page
 */
export async function generateMetadata({ 
  params 
}: { 
  params: { slug: string } 
}): Promise<Metadata> {
  const profile = profilesData[params.slug];
  
  if (!profile) {
    return {
      title: 'Profile Not Found - MuslimEEN',
    };
  }

  return generateProfileMetadata({
    fullName: profile.fullName,
    headline: profile.headline,
    bio: profile.bio,
    slug: profile.slug,
    industry: profile.industry,
    location: profile.location,
    skills: profile.skills,
  });
}

/**
 * Profile page loading state
 */
function ProfileLoading() {
  return (
    <div className="profile-loading" role="status" aria-live="polite">
      <div className="loading-skeleton profile-skeleton" />
      <p>Loading profile...</p>
    </div>
  );
}

/**
 * Profile Page Component
 * 
 * Fully server-rendered with:
 * - Dynamic metadata
 * - Person schema for rich snippets
 * - Breadcrumb navigation
 */
export default function ProfilePage({ 
  params 
}: { 
  params: { slug: string } 
}) {
  const profile = profilesData[params.slug];

  // Return 404 if profile not found
  if (!profile) {
    notFound();
  }

  const baseUrl = SITE_CONFIG.baseUrl;
  const initials = profile.fullName.split(' ').map(n => n[0]).join('').slice(0, 2);

  return (
    <>
      {/* Person Schema for rich search results */}
      <PersonSchema
        name={profile.fullName}
        slug={profile.slug}
        jobTitle={profile.headline}
        description={profile.bio}
        company={profile.company}
        location={profile.location}
        skills={profile.skills}
        trustScore={profile.trustScore}
        verificationLevel={profile.verificationLevel}
        joinedDate={profile.joinedDate}
      />

      {/* Breadcrumb structured data */}
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: baseUrl },
          { name: 'People', url: `${baseUrl}/people` },
          { name: profile.fullName },
        ]}
      />

      <main className="profile-page">
        <div className="container">
          {/* Profile Header */}
          <header className="profile-header" aria-labelledby="profile-name">
            <div className="profile-identity">
              <div className="avatar avatar-xl">{initials}</div>
              <div className="profile-intro">
                <h1 id="profile-name">{profile.fullName}</h1>
                <p className="profile-headline">{profile.headline}</p>
                <p className="profile-location">📍 {profile.location}</p>
                
                <div className="profile-actions">
                  <button className="btn btn-primary">Connect</button>
                  <button className="btn btn-outline">Message</button>
                  <button className="btn btn-ghost">More</button>
                </div>
              </div>
            </div>

            <div className="profile-trust-panel">
              <div className="trust-score-display">
                <span className="trust-score-value">{profile.trustScore}</span>
                <span className="trust-score-label">Trust Score</span>
              </div>
              <div className="verification-status">
                <span className="badge badge-verified">{profile.verificationLevel}</span>
              </div>
              <p className="member-since">Member since {profile.joinedDate}</p>
            </div>
          </header>

          <div className="profile-content">
            {/* Main Column */}
            <div className="profile-main">
              {/* About Section */}
              <section className="profile-section" aria-labelledby="about-heading">
                <h2 id="about-heading">About</h2>
                <p>{profile.bio}</p>
              </section>

              {/* Skills Section */}
              <section className="profile-section" aria-labelledby="skills-heading">
                <h2 id="skills-heading">Skills</h2>
                <div className="skills-list">
                  {profile.skills.map((skill) => (
                    <span key={skill} className="skill-tag">
                      {skill}
                    </span>
                  ))}
                </div>
              </section>

              {/* Experience Section */}
              <section className="profile-section" aria-labelledby="experience-heading">
                <h2 id="experience-heading">Experience</h2>
                <div className="experience-list">
                  {profile.experience.map((exp, index) => (
                    <div key={index} className="experience-item">
                      <h4>{exp.title}</h4>
                      <p className="company">{exp.company}</p>
                      <p className="duration">{exp.duration}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Education Section */}
              <section className="profile-section" aria-labelledby="education-heading">
                <h2 id="education-heading">Education</h2>
                <div className="education-list">
                  {profile.education.map((edu, index) => (
                    <div key={index} className="education-item">
                      <h4>{edu.degree}</h4>
                      <p className="institution">{edu.institution}</p>
                      <p className="year">{edu.year}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Sidebar */}
            <aside className="profile-sidebar" aria-label="Profile sidebar">
              <div className="sidebar-card">
                <h3>Industry</h3>
                <p>{profile.industry}</p>
              </div>

              <div className="sidebar-card">
                <h3>Connect with {profile.fullName.split(' ')[0]}</h3>
                <p>Expand your network by connecting with professionals in {profile.industry}.</p>
                <Link href="/connections" className="btn btn-primary btn-full">
                  Find More {profile.industry} Professionals
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
