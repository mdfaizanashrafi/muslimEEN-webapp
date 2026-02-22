/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export for deployment to Vercel or other static hosts
  output: 'export',
  distDir: 'dist',
  images: {
    unoptimized: true,
  },
  // Enable trailing slashes for static export compatibility
  trailingSlash: true,
};

module.exports = nextConfig;
