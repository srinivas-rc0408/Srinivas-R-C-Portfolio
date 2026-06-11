/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["pdf-lib", "sharp"]
  },
  images: {
    formats: ['image/avif', 'image/webp'],
  }
};

export default nextConfig;
