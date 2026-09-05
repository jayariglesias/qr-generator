import type { NextConfig } from 'next';

const isGithubPages = process.env.GITHUB_PAGES === 'true';

const nextConfig: NextConfig = {
  // Docker uses a Node server (`standalone`). GitHub Pages needs a static `out/` folder.
  output: isGithubPages ? 'export' : 'standalone',
  // In CI, actions/configure-pages injects basePath. Keep it for local static builds.
  ...(isGithubPages && !process.env.CI ? { basePath: '/qr-generator' } : {}),
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
