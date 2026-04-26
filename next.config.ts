import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
      {
        // Google profile photos returned by OAuth
        protocol: "https",
        hostname: "*.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
