import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@forgefit/program-engine",
    "@forgefit/evidence-kb",
    "@forgefit/exercise-db",
  ],
  turbopack: {
    root: "../..",
  },
};

export default nextConfig;
