/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://sentinel-welfare-sih2026.onrender.com/api';
    const target = apiUrl.replace(/\/$/, '');
    return [
      {
        source: '/api/:path*',
        destination: `${target}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
