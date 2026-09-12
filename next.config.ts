import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: { unoptimized: true },
  eslint: { ignoreDuringBuilds: process.env.NEXT_IGNORE_ESLINT === 'true' },
  typescript: { ignoreBuildErrors: process.env.NEXT_IGNORE_TYPECHECK === 'true' },
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'nexoragroup.ink' }],
        destination: 'https://www.nexoragroup.ink/:path*',
        permanent: true,
      },
    ]
  },
}

export default nextConfig