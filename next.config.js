/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@medplum/core'],
  },
  images: {
    remotePatterns: [],
  },
}

module.exports = nextConfig
