import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'png.pngtree.com',
      },
    ],
    unoptimized: true, // Disable image optimization to avoid timeout
  },
}

export default nextConfig