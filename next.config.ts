import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: { unoptimized: true },
  eslint: { ignoreDuringBuilds: process.env.NEXT_IGNORE_ESLINT === 'true' },
  typescript: { ignoreBuildErrors: process.env.NEXT_IGNORE_TYPECHECK === 'true' },
}

export default nextConfig
