/**
 * Job Listing Detail Page - Server Component
 * 
 * Individual job posting pages with JobPosting schema for Google Jobs.
 * SEO-optimized with dynamic metadata and structured data.
 * 
 * @see SEO_IMPLEMENTATION_PLAN.md Phase 3
 * @see https://developers.google.com/search/docs/appearance/structured-data/job-posting
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { generatePageMetadata, SITE_CONFIG } from '@/lib/seo/metadata';
import { JobPostingSchema, BreadcrumbSchema, FAQSchema } from '@/components/seo';

// Mock job data - replace with API call in production
interface JobData {
  slug: string;
  title: string;
  company: string;
  companyLogo?: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  location: string;
  locationType: 'TELECOMMUTE' | 'ONSITE' | 'HYBRID';
  employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACTOR' | 'INTERN';
  salary: {
    min: number;
    max: number;
    currency: string;
    unit: 'HOUR' | 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';
  };
  benefits: string[];
  postedAt: string;
  validThrough: string;
  applicationUrl: string;
  industry: string;
  experienceLevel: string;
}

const jobsData: Record<string, JobData> = {
  'senior-software-engineer': {
    slug: 'senior-software-engineer',
    title: 'Senior Software Engineer',
    company: 'Islamic Tech Solutions',
    description: 'Join our team building innovative fintech solutions for the Muslim community. We are seeking an experienced software engineer to lead development of our core platform.',
    responsibilities: [
      'Design and implement scalable web applications',
      'Lead technical architecture decisions',
      'Mentor junior developers',
      'Collaborate with product and design teams',
      'Ensure code quality through reviews and testing',
    ],
    requirements: [
      '5+ years of experience in software development',
      'Strong proficiency in React, Node.js, and TypeScript',
      'Experience with cloud platforms (AWS/GCP)',
      'Understanding of Islamic finance principles preferred',
      'Excellent communication skills',
    ],
    location: 'London, UK',
    locationType: 'HYBRID',
    employmentType: 'FULL_TIME',
    salary: {
      min: 60000,
      max: 80000,
      currency: 'GBP',
      unit: 'YEAR',
    },
    benefits: [
      'Prayer room on-site',
      'Halal cafeteria',
      'Flexible working hours',
      'Professional development budget',
      'Health insurance',
    ],
    postedAt: '2026-03-01',
    validThrough: '2026-04-30',
    applicationUrl: '/apply/senior-software-engineer',
    industry: 'Technology',
    experienceLevel: 'Senior',
  },
  'islamic-finance-analyst': {
    slug: 'islamic-finance-analyst',
    title: 'Islamic Finance Analyst',
    company: 'Al-Baraka Bank',
    description: 'We are looking for a detail-oriented Islamic Finance Analyst to support our Shariah compliance and product development teams.',
    responsibilities: [
      'Analyze financial products for Shariah compliance',
      'Prepare reports on Islamic banking operations',
      'Assist in developing new Islamic finance products',
      'Monitor market trends in Islamic finance',
      'Support audit and compliance activities',
    ],
    requirements: [
      'Bachelor\'s degree in Finance, Economics, or related field',
      'Understanding of Islamic finance principles',
      'Strong analytical and Excel skills',
      'Excellent written and verbal communication',
      'Knowledge of banking regulations preferred',
    ],
    location: 'Birmingham, UK',
    locationType: 'ONSITE',
    employmentType: 'FULL_TIME',
    salary: {
      min: 35000,
      max: 50000,
      currency: 'GBP',
      unit: 'YEAR',
    },
    benefits: [
      'Competitive salary',
      'Performance bonus',
      'Professional certifications support',
      'Health and dental insurance',
      'Pension scheme',
    ],
    postedAt: '2026-03-05',
    validThrough: '2026-05-05',
    applicationUrl: '/apply/islamic-finance-analyst',
    industry: 'Finance',
    experienceLevel: 'Mid-level',
  },
};

// Job posting FAQs
const jobFAQs = [
  {
    question: 'How do I apply for this position?',
    answer: 'Click the "Apply Now" button and complete the application form. Make sure your MuslimEEN profile is up to date with your latest experience and skills.',
  },
  {
    question: 'What is the trust score requirement?',
    answer: 'Most employers prefer candidates with a trust score above 600. A higher trust score increases your visibility to employers.',
  },
  {
    question: 'How long does the hiring process take?',
    answer: 'The hiring process typically takes 2-4 weeks. You will receive updates through your MuslimEEN messages.',
  },
];

export function generateStaticParams() {
  return Object.keys(jobsData).map((slug) => ({
    slug,
  }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const job = jobsData[params.slug];
  
  if (!job) {
    return {
      title: 'Job Not Found - MuslimEEN',
    };
  }

  return generatePageMetadata({
    title: `${job.title} at ${job.company}`,
    description: `${job.description.slice(0, 150)}... Apply for this ${job.employmentType.toLowerCase().replace('_', '-')} position in ${job.location}.`,
    path: `/marketplace/earn/${job.slug}`,
    type: 'job',
    keywords: [
      job.title,
      job.company,
      job.industry,
      'halal job',
      'Islamic workplace',
      job.location,
    ],
  });
}

export default function JobListingPage({ params }: { params: { slug: string } }) {
  const job = jobsData[params.slug];

  if (!job) {
    notFound();
  }

  const baseUrl = SITE_CONFIG.baseUrl;

  return (
    <>
      {/* JobPosting Schema for Google Jobs */}
      <JobPostingSchema
        title={job.title}
        description={job.description}
        company={job.company}
        location={job.location}
        slug={job.slug}
        datePosted={job.postedAt}
        employmentType={job.employmentType}
        salary={job.salary}
        responsibilities={job.responsibilities.join('\n')}
        benefits={job.benefits}
        applicationUrl={`${baseUrl}${job.applicationUrl}`}
        validThrough={job.validThrough}
        remoteStatus={job.locationType}
      />

      {/* FAQ Schema */}
      <FAQSchema items={jobFAQs} />

      {/* Breadcrumb Schema */}
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: baseUrl },
          { name: 'Marketplace', url: `${baseUrl}/marketplace` },
          { name: 'EARN', url: `${baseUrl}/marketplace/earn` },
          { name: job.title },
        ]}
      />

      <main className="job-listing-page">
        <div className="container">
          {/* Job Header */}
          <header className="job-header" aria-labelledby="job-title">
            <div className="job-meta">
              <span className="job-category">{job.industry}</span>
              <span className="job-posted">Posted {new Date(job.postedAt).toLocaleDateString()}</span>
            </div>
            <h1 id="job-title">{job.title}</h1>
            <p className="job-company">{job.company}</p>
            
            <div className="job-tags">
              <span className="badge badge-location">📍 {job.location}</span>
              <span className="badge badge-type">💼 {job.employmentType.replace('_', ' ')}</span>
              <span className="badge badge-level">📊 {job.experienceLevel}</span>
              {job.locationType === 'TELECOMMUTE' && (
                <span className="badge badge-remote">🏠 Remote</span>
              )}
              {job.locationType === 'HYBRID' && (
                <span className="badge badge-hybrid">🏢 Hybrid</span>
              )}
            </div>
          </header>

          <div className="job-content">
            {/* Main Content */}
            <div className="job-main">
              {/* Description */}
              <section aria-labelledby="description-heading">
                <h2 id="description-heading">About the Role</h2>
                <p>{job.description}</p>
              </section>

              {/* Responsibilities */}
              <section aria-labelledby="responsibilities-heading">
                <h2 id="responsibilities-heading">Responsibilities</h2>
                <ul>
                  {job.responsibilities.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </section>

              {/* Requirements */}
              <section aria-labelledby="requirements-heading">
                <h2 id="requirements-heading">Requirements</h2>
                <ul>
                  {job.requirements.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </section>

              {/* Benefits */}
              <section aria-labelledby="benefits-heading">
                <h2 id="benefits-heading">Benefits</h2>
                <ul className="benefits-list">
                  {job.benefits.map((benefit, index) => (
                    <li key={index} className="benefit-item">
                      <span className="benefit-check">✓</span>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            {/* Sidebar */}
            <aside className="job-sidebar" aria-label="Job details">
              {/* Salary Card */}
              <div className="sidebar-card">
                <h3>Salary</h3>
                <p className="salary-range">
                  {job.salary.currency === 'GBP' && '£'}
                  {job.salary.min.toLocaleString()} - {job.salary.max.toLocaleString()}
                  <span className="salary-period">/{job.salary.unit.toLowerCase()}</span>
                </p>
              </div>

              {/* Apply Card */}
              <div className="sidebar-card apply-card">
                <h3>Ready to Apply?</h3>
                <p>Make sure your profile is complete before applying.</p>
                <Link href={job.applicationUrl} className="btn btn-primary btn-lg btn-full">
                  Apply Now
                </Link>
                <p className="apply-deadline">
                  Apply before {new Date(job.validThrough).toLocaleDateString()}
                </p>
              </div>

              {/* Company Card */}
              <div className="sidebar-card">
                <h3>About {job.company}</h3>
                <p>View company profile and other job openings.</p>
                <Link href="#" className="btn btn-outline btn-sm">
                  View Company
                </Link>
              </div>

              {/* Share Card */}
              <div className="sidebar-card">
                <h3>Share this Job</h3>
                <div className="share-buttons">
                  <button className="btn btn-ghost btn-sm">LinkedIn</button>
                  <button className="btn btn-ghost btn-sm">Twitter</button>
                  <button className="btn btn-ghost btn-sm">Email</button>
                </div>
              </div>
            </aside>
          </div>

          {/* Related Jobs */}
          <section className="related-jobs" aria-labelledby="related-heading">
            <h2 id="related-heading">Similar Opportunities</h2>
            <div className="related-jobs-list">
              <p>Browse more jobs in {job.industry}</p>
              <Link href="/marketplace/earn" className="btn btn-outline">
                View All Jobs
              </Link>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
