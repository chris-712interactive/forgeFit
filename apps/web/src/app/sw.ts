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

/** Keep one revision per URL — duplicate precache entries crash SW install. */
function dedupePrecacheEntries(
  entries: (PrecacheEntry | string)[] | undefined
): (PrecacheEntry | string)[] {
  if (!entries?.length) return [];
  const byUrl = new Map<string, PrecacheEntry | string>();
  for (const entry of entries) {
    const url = typeof entry === "string" ? entry : entry.url;
    byUrl.set(url, entry);
  }
  return [...byUrl.values()];
}

const APP_ROUTES = /^\/(home|workout|nutrition|progress|profile|exercises)(\/.*)?$/;

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

const iconCachePlugins = [
  new CacheableResponsePlugin({ statuses: [0, 200] }),
  new ExpirationPlugin({
    maxEntries: 16,
    maxAgeSeconds: 30 * 24 * 60 * 60,
    maxAgeFrom: "last-used",
  }),
  {
    handlerDidError: async () => {
      const cache = await caches.open("forgefit-icons");
      return (
        (await cache.match("/icon-192.png")) ??
        (await cache.match("/logo-icon.svg"))
      );
    },
  },
];

const serwist = new Serwist({
  precacheEntries: dedupePrecacheEntries(self.__SW_MANIFEST),
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
    // Manifest must stay fresh — CacheFirst was serving stale short_name after rebrand.
    {
      matcher: ({ url, sameOrigin }) =>
        sameOrigin &&
        (url.pathname === "/manifest.json" ||
          url.pathname === "/manifest.webmanifest"),
      handler: new NetworkFirst({
        cacheName: "forgefit-manifest",
        networkTimeoutSeconds: 3,
        plugins: [
          new CacheableResponsePlugin({ statuses: [0, 200] }),
          new ExpirationPlugin({
            maxEntries: 2,
            maxAgeSeconds: 60 * 60,
          }),
        ],
      }),
    },
    // Browsers always request /favicon.ico; defaultCache uses StaleWhileRevalidate
    // which throws no-response offline when the icon was never cached.
    {
      matcher: ({ url, sameOrigin }) =>
        sameOrigin &&
        (url.pathname === "/favicon.ico" ||
          url.pathname === "/logo-icon.svg" ||
          url.pathname === "/favicon-32.png" ||
          url.pathname === "/icon-192.png" ||
          url.pathname === "/icon-512.png" ||
          url.pathname === "/apple-touch-icon.png"),
      handler: new CacheFirst({
        cacheName: "forgefit-icons",
        plugins: iconCachePlugins,
      }),
    },
    {
      matcher: ({ url, sameOrigin }) =>
        sameOrigin &&
        /\.(?:ico|svg|png|jpg|jpeg|gif|webp)$/i.test(url.pathname),
      handler: new CacheFirst({
        cacheName: "forgefit-static-images",
        plugins: iconCachePlugins,
      }),
    },
    {
      matcher: ({ url }) =>
        url.hostname === "raw.githubusercontent.com" &&
        url.pathname.includes("/free-exercise-db/"),
      handler: new CacheFirst({
        cacheName: "forgefit-exercise-media",
        plugins: [
          new CacheableResponsePlugin({ statuses: [0, 200] }),
          new ExpirationPlugin({
            maxEntries: 512,
            maxAgeSeconds: 60 * 24 * 60 * 60,
            maxAgeFrom: "last-used",
          }),
        ],
      }),
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
