import type { Metadata } from "next";
import { buildSocialImageFields } from "./social-image-metadata";
import { getSiteUrl } from "./site-url";

const title =
  "ForgeRep — Personalized Workout & Macro Tracker App | Free to Start";
const description =
  "ForgeRep is an evidence-based fitness app with personalized workout programs, offline gym logging, and macro tracking. See weekly progress at a glance. Free tier includes programs, nutrition diary, and 30-day projections — no credit card required.";

const keywords = [
  "fitness app",
  "workout tracker app",
  "macro tracker app",
  "workout log app",
  "offline gym app",
  "personalized workout plan",
  "evidence-based training",
  "progressive overload tracker",
  "nutrition tracking app",
  "bodybuilding program app",
  "strength training app",
  "fat loss workout plan",
  "hypertrophy program",
  "PWA fitness app",
  "free workout tracker",
  "macro counting app",
  "weight loss fitness app",
  "muscle building app",
  "gym workout planner",
  "ForgeRep",
];

export function buildLandingMetadata(): Metadata {
  const siteUrl = getSiteUrl();
  const { openGraphImages, twitterImages, twitterCard } =
    buildSocialImageFields();

  return {
    title,
    description,
    keywords,
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: "/",
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: siteUrl,
      siteName: "ForgeRep",
      title,
      description,
      images: openGraphImages,
    },
    twitter: {
      card: twitterCard,
      title,
      description,
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
