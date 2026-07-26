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
  webpack: (config: any, { isServer }: any) => {
    if (isServer) {
      // Ensure razorpay is treated as an external module on server
      config.externals.push('razorpay');
    }
    return config;
  },
  async redirects() {
    return [
      // Redirect os.wazireducationsociety.org to dps.wazireducationsociety.org
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'os.wazireducationsociety.org',
          },
        ],
        destination: 'https://dps.wazireducationsociety.org/:path*',
        permanent: true,
      },
    ];
  },
} as any;

export default nextConfig;
