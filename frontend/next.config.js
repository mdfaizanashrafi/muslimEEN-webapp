/** @type {import('next').NextConfig} */
const nextConfig = {
  // Temporarily disable static export for dev mode
  // output: 'export',
  // distDir: 'dist',
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
