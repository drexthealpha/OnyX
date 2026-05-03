import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  env: {
    NEXT_PUBLIC_NERVE_PORT: process.env.NERVE_PORT ?? '3001',
    NEXT_PUBLIC_NERVE_URL: process.env.NERVE_URL ?? '',
  },
};

export default nextConfig;