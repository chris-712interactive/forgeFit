"use client";

import {
  TIMEZONE_COOKIE,
  TIMEZONE_COOKIE_MAX_AGE,
} from "@/lib/datetime/timezone-cookie";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

function readTimezoneCookie(): string | null {
  const prefix = `${TIMEZONE_COOKIE}=`;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(prefix));
  if (!match) return null;
  return decodeURIComponent(match.slice(prefix.length));
}

export function TimezoneSync() {
  const router = useRouter();
  const refreshed = useRef(false);

  useEffect(() => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!timeZone) return;

    const existing = readTimezoneCookie();
    if (existing === timeZone) return;

    document.cookie = `${TIMEZONE_COOKIE}=${encodeURIComponent(timeZone)}; path=/; max-age=${TIMEZONE_COOKIE_MAX_AGE}; SameSite=Lax`;

    if (!refreshed.current) {
      refreshed.current = true;
      router.refresh();
    }
  }, [router]);

  return null;
}
