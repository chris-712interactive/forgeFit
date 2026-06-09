import type { Metadata } from "next";
import { getSiteUrl } from "./site-url";

const title = "forgeFit — Evidence-Based Fitness That Keeps You Accountable";
const description =
  "Personalized workout programs, macro tracking, and weekly progress at a glance. Mobile-first fitness app built for the gym — works offline when signal doesn't.";

const keywords = [
  "fitness app",
  "workout tracker",
  "macro tracker",
  "evidence-based training",
  "offline gym app",
  "personalized workout plan",
  "nutrition tracking",
  "progressive overload",
  "bodybuilding program",
  "strength training app",
  "PWA fitness",
  "forgeFit",
];

export function buildLandingMetadata(): Metadata {
  const siteUrl = getSiteUrl();

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
      siteName: "forgeFit",
      title,
      description,
      images: [
        {
          url: "/logo-icon.svg",
          width: 512,
          height: 512,
          alt: "forgeFit app icon",
        },
      ],
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: ["/logo-icon.svg"],
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
