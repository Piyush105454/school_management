import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
    optimizePackageImports: ['lucide-react', 'clsx', 'tailwind-merge'],
  },
  productionBrowserSourceMaps: false,
};

export default nextConfig;
