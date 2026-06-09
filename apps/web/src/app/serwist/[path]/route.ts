import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createSerwistRoute } from "@serwist/turbopack";

const revision =
  spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" }).stdout.trim() ||
  randomUUID();

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } =
  createSerwistRoute({
    // Don't precache /logo-icon.svg, /favicon.ico, or /manifest.json here —
    // Turbopack already adds them to __SW_MANIFEST; duplicate URLs with
    // different revisions crash the SW (add-to-cache-list-conflicting-entries).
    additionalPrecacheEntries: [
      { url: "/~offline", revision },
      { url: "/home", revision },
      { url: "/workout", revision },
      { url: "/nutrition", revision },
      { url: "/progress", revision },
      { url: "/profile", revision },
    ],
    swSrc: "src/app/sw.ts",
    useNativeEsbuild: true,
  });
