import type { Metadata } from "next";
import { buildSocialImageFields } from "./social-image-metadata";
import { getSiteUrl } from "./site-url";

const title = "Functional Conditioning App — Strength + Circuits | ForgeRep";
const description =
  "ForgeRep builds hybrid functional conditioning programs: compound strength days plus AMRAP and circuit sessions. Evidence-based, offline workout logging, free to start.";

const keywords = [
  "functional conditioning app",
  "functional fitness app",
  "metabolic conditioning program",
  "circuit training app",
  "mixed modal training",
  "strength and conditioning app",
  "AMRAP workout tracker",
  "functional training program",
  "ForgeRep",
];

export function buildFunctionalConditioningMetadata(): Metadata {
  const siteUrl = getSiteUrl();
  const canonical = "/functional-conditioning";
  const { openGraphImages, twitterImages, twitterCard } =
    buildSocialImageFields();

  return {
    title,
    description,
    keywords,
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical,
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: `${siteUrl}${canonical}`,
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
    },
    category: "health_and_fitness",
  };
}
