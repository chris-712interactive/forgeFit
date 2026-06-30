declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

const SIGNUP_TRACKED_KEY = "forge_signup_tracked";

/** Push a signup conversion for GTM/MNTN (Custom Event trigger: `forge_signup`). */
export function pushSignupConversionEvent(): void {
  if (typeof window === "undefined") {
    return;
  }

  if (sessionStorage.getItem(SIGNUP_TRACKED_KEY)) {
    return;
  }

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: "forge_signup",
    conversion_type: "Sign Up",
  });

  sessionStorage.setItem(SIGNUP_TRACKED_KEY, "1");
}

/** Push optional onboarding previous-app answer for GTM segmentation. */
export function pushSignupSourceEvent(source: string): void {
  if (typeof window === "undefined" || !source.trim()) {
    return;
  }

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: "forge_signup_source",
    signup_source: source.trim(),
  });
}

export function pushMfpImportCompletedEvent(imported: number): void {
  if (typeof window === "undefined" || imported <= 0) {
    return;
  }

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: "forge_mfp_import_completed",
    imported_count: imported,
  });
}
