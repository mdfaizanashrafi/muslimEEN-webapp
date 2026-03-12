/**
 * OpenGraph Image - Root Level
 * 
 * Generates dynamic OpenGraph images for the homepage and fallback.
 * Uses Next.js ImageResponse for SVG-based image generation.
 * 
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image#generate-images-using-code-js-ts-tsx
 */

import { ImageResponse } from 'next/og';
import { SITE_CONFIG } from '@/lib/seo/metadata';

// Route segment config
export const runtime = 'edge';

// Image metadata
export const alt = 'MuslimEEN - Muslim Economic Empowerment Network';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

/**
 * Default OpenGraph Image
 * 
 * Displayed when sharing the homepage or as fallback.
 * Features the MuslimEEN brand with Islamic geometric patterns.
 */
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background Pattern - Islamic Geometric Star */}
        <svg
          width="600"
          height="600"
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

        {/* Content Container */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
            padding: '40px',
            textAlign: 'center',
          }}
        >
          {/* Logo Star */}
          <svg width="80" height="80" viewBox="0 0 32 32" style={{ marginBottom: '24px' }}>
            <path
              d="M16 0L19 12L32 16L19 20L16 32L13 20L0 16L13 12L16 0Z"
              fill="white"
            />
          </svg>

          {/* Title */}
          <h1
            style={{
              fontSize: '72px',
              fontWeight: 'bold',
              color: 'white',
              margin: '0 0 16px 0',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              letterSpacing: '-0.02em',
            }}
          >
            MuslimEEN
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: '32px',
              color: 'rgba(255, 255, 255, 0.9)',
              margin: '0 0 8px 0',
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            Muslim Economic Empowerment Network
          </p>

          {/* Tagline */}
          <p
            style={{
              fontSize: '24px',
              color: 'rgba(255, 255, 255, 0.7)',
              margin: '0',
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            Earn · Build · Live · Protect
          </p>
        </div>

        {/* URL Footer */}
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            fontSize: '20px',
            color: 'rgba(255, 255, 255, 0.6)',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          muslimeen.space
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
