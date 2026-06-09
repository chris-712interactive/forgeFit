import { withSerwist } from "@serwist/turbopack";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@forgefit/program-engine",
    "@forgefit/evidence-kb",
    "@forgefit/exercise-db",
    "@forgefit/offline-sync",
  ],
  turbopack: {
    root: "../..",
  },
  serverExternalPackages: ["esbuild"],
};

export default withSerwist(nextConfig);
