/** @type {import('next').NextConfig} */
const nextConfig = {
  // experimental: {
  //   optimizePackageImports: ['@portabletext/react'],
  //   ppr: 'incremental',
  // },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
      },
      {
        protocol: 'https',
        hostname: 'cdn.brandfetch.io',
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
