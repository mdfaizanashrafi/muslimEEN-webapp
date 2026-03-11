/**
 * Twitter Image - Root Level
 * 
 * Generates dynamic Twitter card images.
 * Twitter uses 1.91:1 aspect ratio (1200x630 same as OG).
 * 
 * @see https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/summary-card-with-large-image
 */

import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'MuslimEEN - Muslim Economic Empowerment Network';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

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
        }}
      >
        {/* Background Pattern */}
        <svg
          width="500"
          height="500"
          viewBox="0 0 100 100"
          style={{
            position: 'absolute',
            opacity: 0.08,
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

        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
          }}
        >
          {/* Logo */}
          <svg width="64" height="64" viewBox="0 0 32 32" style={{ marginBottom: '20px' }}>
            <path
              d="M16 0L19 12L32 16L19 20L16 32L13 20L0 16L13 12L16 0Z"
              fill="white"
            />
          </svg>

          <h1
            style={{
              fontSize: '64px',
              fontWeight: 'bold',
              color: 'white',
              margin: '0 0 12px 0',
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            MuslimEEN
          </h1>

          <p
            style={{
              fontSize: '28px',
              color: 'rgba(255, 255, 255, 0.85)',
              margin: '0',
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            Muslim Economic Empowerment Network
          </p>
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: '32px',
            fontSize: '18px',
            color: 'rgba(255, 255, 255, 0.5)',
          }}
        >
          @muslimeen
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
