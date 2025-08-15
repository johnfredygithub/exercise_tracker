const nextConfig = {
  reactStrictMode: true,
  //  swcMinify: true
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },
};

///export default nextConfig;
module.exports = nextConfig;
