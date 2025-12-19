import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    // Whitelist external domains using remotePatterns
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com', // The domain causing your error
        port: '',
        pathname: '/**', // Allows any path on that domain
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com', // Also include the domain for the avatars
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
