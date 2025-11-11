/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com", // Google avatars
      },
      {
        protocol: "https",
        hostname: "www.guauandcat.com", // Guau&Cat products
      },
      {
        protocol: "https",
        hostname: "www.vitakraft.es", // Vitakraft products
      },
      {
        protocol: "https",
        hostname: "www.dia.es", // Dia products
      },
    ],
  },
};

export default nextConfig;
