/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      // Upload action accepts images up to 5 MB; leave room for multipart overhead.
      bodySizeLimit: "6mb",
    },
  },
};
export default nextConfig;
