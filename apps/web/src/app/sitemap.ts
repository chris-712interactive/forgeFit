import { seoArticles } from "@/lib/seo/articles";
import { getSiteUrl } from "@/lib/seo/site-url";
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const lastModified = new Date();

  const guideEntries: MetadataRoute.Sitemap = seoArticles.map((article) => ({
    url: `${siteUrl}/guides/${article.slug}`,
    lastModified: new Date(`${article.updatedAt}T12:00:00`),
    changeFrequency: "monthly" as const,
    priority: article.category === "comparison" ? 0.85 : 0.8,
  }));

  return [
    {
      url: siteUrl,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/guides`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/functional-conditioning`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.92,
    },
    {
      url: `${siteUrl}/signup`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/login`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    ...guideEntries,
  ];
}
