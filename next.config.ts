import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Catalog imagery is served from DummyJSON's CDN. Without this, every
    // next/image in production fails.
    remotePatterns: [{ protocol: "https", hostname: "cdn.dummyjson.com" }],
  },
};

export default nextConfig;
