/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { typedRoutes: false },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ]
  },
}
module.exports = nextConfig
