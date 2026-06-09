"use client";

import { useEffect } from "react";

const APP_TAB_ROUTES = ["/home", "/workout", "/nutrition", "/progress", "/profile"];

/**
 * Warms the service worker cache for main app tabs while online so bottom-nav
 * works offline after the first session.
 */
export function PrefetchAppShell() {
  useEffect(() => {
    if (!navigator.onLine) return;

    const timer = window.setTimeout(() => {
      void Promise.all(
        APP_TAB_ROUTES.map((route) =>
          fetch(route, { credentials: "same-origin" }).catch(() => undefined)
        )
      );
    }, 2000);

    return () => window.clearTimeout(timer);
  }, []);

  return null;
}
