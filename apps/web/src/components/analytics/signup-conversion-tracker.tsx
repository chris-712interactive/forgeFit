"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { pushSignupConversionEvent } from "@/lib/analytics/events";

/** Fires `forge_signup` when auth callback redirects with `?signup=1`. */
export function SignupConversionTracker() {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("signup") !== "1") {
      return;
    }

    pushSignupConversionEvent();

    const url = new URL(window.location.href);
    url.searchParams.delete("signup");
    const next =
      url.pathname +
      (url.searchParams.toString() ? `?${url.searchParams}` : "") +
      url.hash;
    window.history.replaceState(window.history.state, "", next);
  }, [searchParams]);

  return null;
}
