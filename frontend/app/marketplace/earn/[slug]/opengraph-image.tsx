/**
 * Job Listing OpenGraph Image - Dynamic
 * 
 * Generates OG images for individual job listings.
 * Displays job title, company, location, and salary.
 */

import { ImageResponse } from 'next/og';

export const runtime = 'edge';

// Job data - in production, fetch from API
const jobsData: Record<string, {
  title: string;
  company: string;
  location: string;
  salary: string;
  type: string;
}> = {
  'senior-software-engineer': {
    title: 'Senior Software Engineer',
    company: 'Islamic Tech Solutions',
    location: 'London, UK',
    salary: '£60,000 - £80,000',
    type: 'Full-time',
  },
  'islamic-finance-analyst': {
    title: 'Islamic Finance Analyst',
    company: 'Al-Baraka Bank',
    location: 'Birmingham, UK',
    salary: '£35,000 - £50,000',
    type: 'Full-time',
  },
};

export default async function Image({ params }: { params: { slug: string } }) {
  const job = jobsData[params.slug] || {
    title: 'Job Opportunity',
    company: 'MuslimEEN Partner',
    location: 'Remote',
    salary: 'Competitive',
    type: 'Full-time',
  };

  return new ImageResponse(
    (
      <div
        style={{
          background: 'white',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '60px',
          position: 'relative',
        }}
      >
        {/* Header - MuslimEEN EARN Branding */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <svg width="32" height="32" viewBox="0 0 32 32">
              <path
                d="M16 0L19 12L32 16L19 20L16 32L13 20L0 16L13 12L16 0Z"
                fill="#059669"
              />
            </svg>
            <span
              style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#059669',
              }}
            >
              MuslimEEN
            </span>
          </div>
          <div
            style={{
              background: '#ecfdf5',
              color: '#059669',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '18px',
              fontWeight: '600',
            }}
          >
            EARN Marketplace
          </div>
        </div>

        {/* Job Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            justifyContent: 'center',
          }}
        >
          {/* Job Type Badge */}
          <div
            style={{
              background: '#059669',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '18px',
              fontWeight: '600',
              alignSelf: 'flex-start',
              marginBottom: '24px',
            }}
          >
            {job.type}
          </div>

          {/* Job Title */}
          <h1
            style={{
              fontSize: '56px',
              fontWeight: 'bold',
              color: '#111827',
              margin: '0 0 16px 0',
              lineHeight: 1.2,
            }}
          >
            {job.title}
          </h1>

          {/* Company */}
          <p
            style={{
              fontSize: '32px',
              color: '#4b5563',
              margin: '0 0 32px 0',
            }}
          >
            {job.company}
          </p>

          {/* Details Row */}
          <div
            style={{
              display: 'flex',
              gap: '32px',
              marginBottom: '32px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '24px',
                color: '#6b7280',
              }}
            >
              <span>📍</span>
              {job.location}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '24px',
                color: '#6b7280',
              }}
            >
              <span>💰</span>
              {job.salary}
            </div>
          </div>

          {/* CTA */}
          <div
            style={{
              background: '#059669',
              color: 'white',
              padding: '16px 32px',
              borderRadius: '8px',
              fontSize: '24px',
              fontWeight: '600',
              alignSelf: 'flex-start',
            }}
          >
            Apply on MuslimEEN
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 'auto',
          }}
        >
          <span
            style={{
              fontSize: '18px',
              color: '#9ca3af',
            }}
          >
            Verified Halal Job Opportunity
          </span>
          <span
            style={{
              fontSize: '18px',
              color: '#9ca3af',
            }}
          >
            muslimeen.space
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
