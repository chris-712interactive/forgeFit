import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createSerwistRoute } from "@serwist/turbopack";

const revision =
  spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" }).stdout.trim() ||
  randomUUID();

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } =
  createSerwistRoute({
    additionalPrecacheEntries: [
      { url: "/~offline", revision },
      { url: "/home", revision },
      { url: "/workout", revision },
      { url: "/nutrition", revision },
      { url: "/progress", revision },
      { url: "/profile", revision },
      { url: "/logo-icon.svg", revision },
      { url: "/favicon.ico", revision },
      { url: "/manifest.json", revision },
    ],
    swSrc: "src/app/sw.ts",
    useNativeEsbuild: true,
  });
