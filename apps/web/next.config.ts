import { withSerwist } from "@serwist/turbopack";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@forgefit/program-engine",
    "@forgefit/evidence-kb",
    "@forgefit/exercise-db",
    "@forgefit/offline-sync",
    "@forgefit/nutrition-core",
    "@forgefit/projection-engine",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
        pathname: "/yuhonas/free-exercise-db/**",
      },
    ],
  },
  turbopack: {
    root: "../..",
  },
  serverExternalPackages: ["esbuild"],
  async rewrites() {
    return [{ source: "/favicon.ico", destination: "/favicon-32.png" }];
  },
};

export default withSerwist(nextConfig);
