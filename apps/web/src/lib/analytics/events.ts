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
