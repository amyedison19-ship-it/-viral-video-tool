import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },
  serverExternalPackages: ['fluent-ffmpeg', '@google/generative-ai'],
};

export default nextConfig;
