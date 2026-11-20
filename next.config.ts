import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Lint src/ during production builds so regressions fail the build
    dirs: ['src'],
  },
  typescript: {
    // Type errors fail the production build
    ignoreBuildErrors: false,
  },
  experimental: {
    // Tree-shake barrel imports from large icon / UI packages
    optimizePackageImports: ['lucide-react', '@tabler/icons-react', 'radix-ui', '@lobehub/icons'],
  },
  turbopack: {
    // Specify the root directory to avoid lockfile conflicts
    root: process.cwd(),
  },
};

export default nextConfig;
