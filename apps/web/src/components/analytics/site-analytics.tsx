import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import {
  GoogleTagManager,
  GoogleTagManagerNoscript,
} from "@/components/analytics/google-tag-manager";

export function SiteAnalytics() {
  return (
    <>
      <GoogleTagManager />
      <GoogleAnalytics />
    </>
  );
}

export { GoogleTagManagerNoscript };
