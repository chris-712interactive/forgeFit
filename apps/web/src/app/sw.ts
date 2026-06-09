/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { defaultCache } from "@serwist/turbopack/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import {
  CacheableResponsePlugin,
  NetworkFirst,
  Serwist,
  StaleWhileRevalidate,
} from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const APP_ROUTES = /^\/(home|workout|nutrition|progress|profile)(\/.*)?$/;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
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
      matcher: ({ request }) =>
        request.headers.get("rsc") === "1" ||
        request.headers.get("next-router-prefetch") === "1" ||
        request.headers.get("next-router-state-tree") !== null,
      handler: new StaleWhileRevalidate({
        cacheName: "forgefit-rsc",
        plugins: [new CacheableResponsePlugin({ statuses: [0, 200] })],
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
