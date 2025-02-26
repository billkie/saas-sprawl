/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'dev.quacco.com', 'www.quacco.com'],
    },
    typedRoutes: true,
  },
  images: {
    domains: ['avatars.githubusercontent.com', 'lh3.googleusercontent.com'],
  },
  env: {
    NEXT_PUBLIC_BASE_URL: process.env.VERCEL_ENV === 'production' 
      ? 'https://www.quacco.com' 
      : 'https://dev.quacco.com',
  },
  // Configure Auth0 to be processed correctly during build
  transpilePackages: ['@auth0/nextjs-auth0'],
}

// Allow Auth0 to be properly processed during build time
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer(nextConfig) 