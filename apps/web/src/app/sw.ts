/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { defaultCache, PAGES_CACHE_NAME } from "@serwist/turbopack/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import {
  CacheableResponsePlugin,
  CacheFirst,
  ExpirationPlugin,
  NetworkFirst,
  NetworkOnly,
  Serwist,
} from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const APP_ROUTES = /^\/(home|workout|nutrition|progress|profile)(\/.*)?$/;

const staticAssetCache = {
  cacheName: "forgefit-next-static",
  plugins: [
    new CacheableResponsePlugin({ statuses: [0, 200] }),
    new ExpirationPlugin({
      maxEntries: 256,
      maxAgeSeconds: 30 * 24 * 60 * 60,
      maxAgeFrom: "last-used",
    }),
  ],
};

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      matcher: ({ url, request, sameOrigin }) =>
        sameOrigin &&
        url.pathname.startsWith("/api/") &&
        request.method !== "GET",
      handler: new NetworkOnly(),
    },
    // Cache all Next.js/Turbopack static assets first — critical for offline chunk loads.
    {
      matcher: ({ url, sameOrigin }) =>
        sameOrigin && url.pathname.startsWith("/_next/static/"),
      handler: new CacheFirst(staticAssetCache),
    },
    {
      matcher: ({ url, sameOrigin }) =>
        sameOrigin && url.pathname.includes("/turbopack"),
      handler: new CacheFirst(staticAssetCache),
    },
    {
      matcher: ({ request, url }) =>
        request.mode === "navigate" && APP_ROUTES.test(url.pathname),
      handler: new NetworkFirst({
        cacheName: "forgefit-app-pages",
        networkTimeoutSeconds: 3,
        plugins: [new CacheableResponsePlugin({ statuses: [0, 200] })],
      }),
    },
    {
      matcher: ({ request, sameOrigin, url }) =>
        sameOrigin &&
        !url.pathname.startsWith("/api/") &&
        (request.headers.get("RSC") === "1" ||
          request.headers.get("next-router-prefetch") === "1" ||
          request.headers.get("next-router-state-tree") !== null),
      handler: new NetworkFirst({
        cacheName: PAGES_CACHE_NAME.rsc,
        networkTimeoutSeconds: 3,
        plugins: [
          new CacheableResponsePlugin({ statuses: [0, 200] }),
          new ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 7 * 24 * 60 * 60 }),
        ],
      }),
    },
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: "/~offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();
