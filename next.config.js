/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'dev.ziruna.com:3000'],
    },
    typedRoutes: true,
  },
  images: {
    domains: ['avatars.githubusercontent.com', 'lh3.googleusercontent.com'],
  },
  env: {
    NEXT_PUBLIC_BASE_URL: process.env.VERCEL_ENV === 'production' 
      ? 'https://ziruna.com' 
      : 'https://dev.ziruna.com',
  },
}

module.exports = nextConfig 