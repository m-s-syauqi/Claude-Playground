import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Allows importing the Neraca Pribadi data file (about 200 KB today).
    serverActions: { bodySizeLimit: "4mb" },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
