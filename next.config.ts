import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pg", "pg-pool", "@prisma/client", "@prisma/adapter-pg"],
  async rewrites() {
    return [
      {
        source: "/",
        has: [{ type: "host", value: "notlar.balogrenci.org" }],
        destination: "/notlar",
      },
      {
        source: "/",
        has: [{ type: "host", value: "odevler.balogrenci.org" }],
        destination: "/odevler",
      },
    ];
  },
};

export default nextConfig;
