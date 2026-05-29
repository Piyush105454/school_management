import type { NextConfig } from "next";

const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
    optimizePackageImports: ['lucide-react', 'clsx', 'tailwind-merge'],
  },
  productionBrowserSourceMaps: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
} as any;

export default nextConfig;
