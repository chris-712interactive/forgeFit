import { getSiteUrl } from "@/lib/seo/site-url";
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/home", "/workout", "/nutrition", "/progress", "/profile", "/onboarding"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
