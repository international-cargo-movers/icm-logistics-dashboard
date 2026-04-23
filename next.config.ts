import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // This is often necessary on Vercel's free tier for larger projects
    // to prevent the TypeScript compiler from exhausting memory.
    ignoreBuildErrors: true,
  },
  eslint: {
    // Similarly, ignore linting during build to save memory
    ignoreDuringBuilds: true,
  },
  // Ensure source maps are disabled in production to reduce memory usage
  productionBrowserSourceMaps: false,
  
  // Experimental optimizations for memory usage
  experimental: {
    // This helps with memory in some Next.js versions
    workerThreads: false,
    cpus: 1
  }
};

export default nextConfig;
