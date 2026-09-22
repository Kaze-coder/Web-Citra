import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const laravelOrigin = (
      process.env.LARAVEL_API_ORIGIN ?? "http://localhost:8000"
    ).replace(/\/$/, "");

    return [
      {
        source: "/api/:path*",
        destination: `${laravelOrigin}/api/:path*`,
      },
      {
        source: "/sanctum/:path*",
        destination: `${laravelOrigin}/sanctum/:path*`,
      },
    ];
  },
};

export default nextConfig;
