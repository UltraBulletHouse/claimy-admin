/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: { domains: ["res.cloudinary.com"] },
  async rewrites() {
    return [
      {
        source: "/api/admin/:path*",
        destination: "https://claimy-backend.vercel.app/api/admin/:path*"
      }
    ];
  }
};

module.exports = nextConfig;
