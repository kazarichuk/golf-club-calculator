import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  experimental: {
    // typedRoutes: true, // Temporarily disabled for Turbopack compatibility
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // This now allows any hostname
      },
      {
        protocol: 'http', // Also allow http for more flexibility
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
