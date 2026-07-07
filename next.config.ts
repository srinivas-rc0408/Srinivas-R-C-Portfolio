import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Next 16 only serves whitelisted qualities; the hammock reveal asks for 100.
    qualities: [75, 100],
  },
};

export default nextConfig;
