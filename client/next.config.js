/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  turbopack: {},
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/api/:path*',
      },
      {
        source: '/uploads/:path*',
        destination: 'http://localhost:5000/uploads/:path*',
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/register',
        destination: '/auth?mode=register',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
