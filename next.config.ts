import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },
  // Allow longer API responses for Claude analysis
  serverExternalPackages: ['fluent-ffmpeg'],
};

export default nextConfig;
