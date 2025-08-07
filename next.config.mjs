/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['@portabletext/react'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/gh/offers',
        has: [{ type: 'query', key: 'slug' }],
        destination: '/gh/offers/:slug',
        permanent: true,
      },
      {
        source: '/ng/offers',
        has: [{ type: 'query', key: 'slug' }],
        destination: '/ng/offers/:slug',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
