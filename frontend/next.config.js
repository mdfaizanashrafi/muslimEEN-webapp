/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: false, // Enable Next.js image optimization
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.muslimeen.space',
      },
    ],
  },
  trailingSlash: true,
  eslint: {
    ignoreDuringBuilds: process.env.NODE_ENV === 'development',
  },
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
    // Note: 'ignoreDurigErrors' was a typo - using correct 'ignoreBuildErrors' above
  },
  
  // Security headers with CSP
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              // Default: only allow same origin
              "default-src 'self'",
              // Scripts: allow same origin, inline (for Next.js), and eval (for development)
              process.env.NODE_ENV === 'production'
                ? "script-src 'self' 'unsafe-inline'"
                : "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              // Styles: allow same origin and inline
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // Fonts: allow same origin and Google Fonts
              "font-src 'self' https://fonts.gstatic.com",
              // Images: allow same origin, data URIs, and HTTPS
              "img-src 'self' data: https:",
              // Connect: allow same origin and API
              "connect-src 'self'",
              // Frame ancestors: prevent clickjacking
              "frame-ancestors 'none'",
              // Form action: only same origin
              "form-action 'self'",
              // Base URI: restrict to same origin
              "base-uri 'self'",
              // Upgrade insecure requests
              "upgrade-insecure-requests",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
