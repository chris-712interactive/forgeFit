import { getSiteUrl } from "@/lib/seo/site-url";

const description =
  "Evidence-based fitness and nutrition app with personalized programs, macro tracking, and offline workout logging.";

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
        operatingSystem: "Web, iOS, Android",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
          description: "Free tier includes programs, tracking, and nutrition diary",
        },
        featureList: [
          "Personalized workout programs",
          "Offline workout logging",
          "Macro and nutrition tracking",
          "Body measurement trends",
          "Exercise library with animations",
        ],
      },
      {
        "@type": "WebPage",
        "@id": `${siteUrl}/#webpage`,
        url: siteUrl,
        name: "ForgeRep — Evidence-Based Fitness That Keeps You Accountable",
        description,
        isPartOf: { "@id": `${siteUrl}/#website` },
        about: { "@id": `${siteUrl}/#app` },
        inLanguage: "en-US",
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
