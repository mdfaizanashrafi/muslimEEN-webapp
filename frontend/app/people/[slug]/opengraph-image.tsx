/**
 * Profile OpenGraph Image - Dynamic
 * 
 * Generates personalized OG images for user profiles.
 * Displays profile info, trust score, and verification status.
 * 
 * @example
 * /people/ahmed-hassan-software-engineer/opengraph-image
 */

import { ImageResponse } from 'next/og';

export const runtime = 'edge';

// Profile data - in production, fetch from API
const profilesData: Record<string, {
  fullName: string;
  headline: string;
  trustScore: number;
  location: string;
}> = {
  'ahmed-hassan-software-engineer': {
    fullName: 'Ahmed Hassan',
    headline: 'Senior Software Engineer',
    trustScore: 945,
    location: 'London, UK',
  },
  'yusuf-ibrahim-data-scientist': {
    fullName: 'Yusuf Ibrahim',
    headline: 'Data Scientist',
    trustScore: 892,
    location: 'Manchester, UK',
  },
  'amina-patel-product-manager': {
    fullName: 'Amina Patel',
    headline: 'Product Manager',
    trustScore: 921,
    location: 'Birmingham, UK',
  },
};

export default async function Image({ params }: { params: { slug: string } }) {
  const profile = profilesData[params.slug] || {
    fullName: 'MuslimEEN Member',
    headline: 'Professional Profile',
    trustScore: 0,
    location: '',
  };

  const initials = profile.fullName.split(' ').map(n => n[0]).join('').slice(0, 2);
  const trustLevel = profile.trustScore >= 800 ? 'high' : profile.trustScore >= 500 ? 'medium' : 'low';
  const trustColor = trustLevel === 'high' ? '#059669' : trustLevel === 'medium' ? '#f59e0b' : '#ef4444';

  return new ImageResponse(
    (
      <div
        style={{
          background: 'white',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          padding: '60px',
          position: 'relative',
        }}
      >
        {/* Left Side - Profile Info */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
          }}
        >
          {/* MuslimEEN Logo */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '40px',
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

          {/* Profile Name */}
          <h1
            style={{
              fontSize: '56px',
              fontWeight: 'bold',
              color: '#111827',
              margin: '0 0 16px 0',
              lineHeight: 1.1,
            }}
          >
            {profile.fullName}
          </h1>

          {/* Headline */}
          <p
            style={{
              fontSize: '32px',
              color: '#4b5563',
              margin: '0 0 24px 0',
            }}
          >
            {profile.headline}
          </p>

          {/* Location */}
          {profile.location && (
            <p
              style={{
                fontSize: '24px',
                color: '#6b7280',
                margin: '0 0 32px 0',
              }}
            >
              📍 {profile.location}
            </p>
          )}

          {/* Trust Score Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: '#f3f4f6',
              padding: '16px 24px',
              borderRadius: '12px',
              alignSelf: 'flex-start',
            }}
          >
            <span
              style={{
                fontSize: '20px',
                color: '#6b7280',
              }}
            >
              Trust Score
            </span>
            <span
              style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: trustColor,
              }}
            >
              {profile.trustScore}
            </span>
          </div>
        </div>

        {/* Right Side - Avatar */}
        <div
          style={{
            width: '280px',
            height: '280px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: '40px',
          }}
        >
          <span
            style={{
              fontSize: '120px',
              fontWeight: 'bold',
              color: 'white',
            }}
          >
            {initials}
          </span>
        </div>

        {/* Footer */}
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            left: '60px',
            fontSize: '20px',
            color: '#9ca3af',
          }}
        >
          muslimeen.space/people/{params.slug}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
