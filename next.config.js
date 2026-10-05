/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize production builds
  swcMinify: true,
  // Disable source maps in production for faster builds
  productionBrowserSourceMaps: false,
  // Optimize images
  images: {
    unoptimized: true,
  },
  // Reduce build time by optimizing dependencies
  experimental: {
    optimizePackageImports: ['gsap', 'lenis'],
  },
  // Speed up linting
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Speed up type checking (only warn, don't fail)
  typescript: {
    ignoreBuildErrors: false,
  },
}

module.exports = nextConfig
