import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  /* The iOS Simulator reaches the dev server at this address. Dev only. */
  allowedDevOrigins: ["127.0.0.1"],
  images: { formats: ["image/avif", "image/webp"] },
  cacheComponents: true,
  partialPrefetching: true,
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
