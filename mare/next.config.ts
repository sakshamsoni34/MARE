import type { NextConfig } from "next";

const backendUrl = 
  process.env.BACKEND_INTERNAL_URL || 
  process.env.NEXT_PUBLIC_API_URL || 
  "http://localhost:8555";

const nextConfig: NextConfig = {
  serverExternalPackages: ["sqlite3"],
  async rewrites() {
    return [
      {
        source: "/api/backend/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
