/**
 * Marketplace Vertical OpenGraph Image - Dynamic
 * 
 * Generates OG images for each marketplace vertical (EARN, BUILD, LIVE, PROTECT).
 * Features distinct colors and content for each vertical.
 */

import { ImageResponse } from 'next/og';

export const runtime = 'edge';

interface VerticalConfig {
  title: string;
  arabic: string;
  description: string;
  color: string;
  gradient: string;
  icon: string;
}

const verticalsConfig: Record<string, VerticalConfig> = {
  earn: {
    title: 'EARN',
    arabic: 'رزق',
    description: 'Jobs, Freelancers & Professional Services',
    color: '#059669',
    gradient: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    icon: '💼',
  },
  build: {
    title: 'BUILD',
    arabic: 'بناء',
    description: 'Ventures, Partnerships & Real Estate',
    color: '#2563eb',
    gradient: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    icon: '🏗️',
  },
  live: {
    title: 'LIVE',
    arabic: 'حياة',
    description: 'Housing, Food & Lifestyle Services',
    color: '#d97706',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    icon: '🏠',
  },
  protect: {
    title: 'PROTECT',
    arabic: 'حفظ',
    description: 'Health, Security & Insurance',
    color: '#9333ea',
    gradient: 'linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)',
    icon: '🛡️',
  },
};

export default async function Image({ params }: { params: { vertical: string } }) {
  const config = verticalsConfig[params.vertical] || verticalsConfig.earn;

  return new ImageResponse(
    (
      <div
        style={{
          background: config.gradient,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          padding: '60px',
        }}
      >
        {/* Background Pattern */}
        <svg
          width="500"
          height="500"
          viewBox="0 0 100 100"
          style={{
            position: 'absolute',
            opacity: 0.1,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <path
            d="M50 0 L61 35 L97 35 L68 57 L79 91 L50 70 L21 91 L32 57 L3 35 L39 35 Z"
            fill="white"
          />
        </svg>

        {/* MuslimEEN Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            position: 'absolute',
            top: '40px',
            left: '40px',
          }}
        >
          <svg width="32" height="32" viewBox="0 0 32 32">
            <path
              d="M16 0L19 12L32 16L19 20L16 32L13 20L0 16L13 12L16 0Z"
              fill="white"
            />
          </svg>
          <span
            style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: 'white',
            }}
          >
            MuslimEEN
          </span>
        </div>

        {/* Main Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            zIndex: 1,
          }}
        >
          {/* Arabic Text */}
          <span
            style={{
              fontSize: '48px',
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: '8px',
            }}
          >
            {config.arabic}
          </span>

          {/* Icon */}
          <span
            style={{
              fontSize: '80px',
              marginBottom: '16px',
            }}
          >
            {config.icon}
          </span>

          {/* Title */}
          <h1
            style={{
              fontSize: '80px',
              fontWeight: 'bold',
              color: 'white',
              margin: '0 0 16px 0',
            }}
          >
            {config.title}
          </h1>

          {/* Description */}
          <p
            style={{
              fontSize: '32px',
              color: 'rgba(255, 255, 255, 0.9)',
              margin: '0',
            }}
          >
            {config.description}
          </p>
        </div>

        {/* Footer URL */}
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            fontSize: '20px',
            color: 'rgba(255, 255, 255, 0.6)',
          }}
        >
          muslimeen.space/marketplace/{params.vertical}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
