/** @type {import('next').NextConfig} */
const nextConfig = {
  // Force trailing slashes on all URLs
  trailingSlash: true,
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
  async headers() {
    return [
      {
        // Apply caching headers to all pages (reduces CPU by enabling CDN caching)
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            // public: can be cached by CDN
            // s-maxage=3600: CDN caches for 1 hour
            // stale-while-revalidate=86400: serve stale content while revalidating for 24 hours
            value: 'public, s-maxage=3600, stale-while-revalidate=86400',
          },
        ],
      },
      {
        // Longer cache for static assets
        source: '/assets/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
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
