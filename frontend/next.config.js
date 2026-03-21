/** @type {import('next').NextConfig} */

// CACHE BUST: 2026-03-21-v1
// CSP is defined in root vercel.json at edge level

const nextConfig = {
  images: {
    unoptimized: false,
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
  },
  // Headers removed - CSP handled at Vercel edge level
};

module.exports = nextConfig;
