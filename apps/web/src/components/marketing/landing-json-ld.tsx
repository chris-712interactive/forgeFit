import { faqItems } from "@/components/marketing/marketing-data";
import { PRO_PLUS_PRICING, PRO_PRICING } from "@/lib/billing/pricing";
import { getSiteUrl } from "@/lib/seo/site-url";

const description =
  "Evidence-based fitness app with personalized workout programs, offline gym logging, macro tracking, and progress projections. Free to start.";

export function LandingJsonLd() {
  const siteUrl = getSiteUrl();

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: "ForgeRep",
        description,
        inLanguage: "en-US",
        publisher: { "@id": `${siteUrl}/#organization` },
      },
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: "ForgeRep",
        url: siteUrl,
        logo: `${siteUrl}/logo-icon.svg`,
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${siteUrl}/#app`,
        name: "ForgeRep",
        url: siteUrl,
        description,
        applicationCategory: "HealthApplication",
        applicationSubCategory: "FitnessApplication",
        operatingSystem: "Web, iOS, Android",
        offers: [
          {
            "@type": "Offer",
            name: "Free",
            price: "0",
            priceCurrency: "USD",
            description:
              "Personalized programs, offline logging, nutrition diary, and 30-day projections",
          },
          {
            "@type": "Offer",
            name: "Pro",
            price: String(PRO_PRICING.monthly.amountUsd),
            priceCurrency: "USD",
            description:
              "90-day projections, analytics, unlimited history, and community features",
          },
          {
            "@type": "Offer",
            name: "Pro+",
            price: String(PRO_PLUS_PRICING.monthly.amountUsd),
            priceCurrency: "USD",
            description:
              "Fitbit sync, restaurant quick-log, personalized coaching copy, and all Pro features",
          },
        ],
        featureList: [
          "Personalized workout programs",
          "Offline workout logging",
          "Macro and nutrition tracking",
          "Body measurement trends",
          "Weight projections",
          "Exercise library with animations",
          "Evidence-based program engine",
        ],
      },
      {
        "@type": "WebPage",
        "@id": `${siteUrl}/#webpage`,
        url: siteUrl,
        name: "ForgeRep — Personalized Workout & Macro Tracker App",
        description,
        isPartOf: { "@id": `${siteUrl}/#website` },
        about: { "@id": `${siteUrl}/#app` },
        inLanguage: "en-US",
      },
      {
        "@type": "FAQPage",
        "@id": `${siteUrl}/#faq`,
        mainEntity: faqItems.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
