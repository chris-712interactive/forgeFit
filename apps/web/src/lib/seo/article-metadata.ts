import type { Metadata } from "next";
import type { SeoArticle } from "@/lib/seo/articles";
import { buildSocialImageFields } from "./social-image-metadata";
import { getSiteUrl } from "./site-url";

export function buildArticleMetadata(article: SeoArticle): Metadata {
  const siteUrl = getSiteUrl();
  const canonicalPath = `/guides/${article.slug}`;
  const title = article.title;
  const { openGraphImages, twitterImages, twitterCard } =
    buildSocialImageFields();

  return {
    title,
    description: article.description,
    keywords: [...article.keywords],
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      type: "article",
      locale: "en_US",
      url: `${siteUrl}${canonicalPath}`,
      siteName: "ForgeRep",
      title,
      description: article.description,
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      images: openGraphImages,
    },
    twitter: {
      card: twitterCard,
      title,
      description: article.description,
      images: twitterImages,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    category: "health_and_fitness",
  };
}

export function buildGuidesIndexMetadata(): Metadata {
  const siteUrl = getSiteUrl();
  const title = "Fitness Guides & App Comparisons";
  const description =
    "Evidence-based training guides, macro tracking tips, offline workout logging advice, and honest comparisons of ForgeRep vs Strong, Hevy, MyFitnessPal, MacroFactor, and Fitbod.";
  const { openGraphImages, twitterImages, twitterCard } =
    buildSocialImageFields();

  return {
    title,
    description,
    keywords: [
      "fitness guides",
      "workout app comparison",
      "evidence based training",
      "macro tracking guide",
      "offline workout tracker",
      "ForgeRep guides",
    ],
    alternates: {
      canonical: "/guides",
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: `${siteUrl}/guides`,
      siteName: "ForgeRep",
      title: `${title} · ForgeRep`,
      description,
      images: openGraphImages,
    },
    twitter: {
      card: twitterCard,
      title: `${title} · ForgeRep`,
      description,
      images: twitterImages,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}
