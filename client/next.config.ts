import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname),
  images: {
    domains: ['images.unsplash.com', 'res.cloudinary.com'],
  },
};

export default nextConfig;
