import type { SeoArticle } from "@/lib/seo/articles";
import { getSiteUrl } from "@/lib/seo/site-url";

function toIsoDateTime(isoDate: string): string {
  if (isoDate.includes("T")) {
    return isoDate;
  }

  return `${isoDate}T08:00:00+00:00`;
}

export function ArticleJsonLd({ article }: { article: SeoArticle }) {
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}/guides/${article.slug}`;
  const publishedAt = toIsoDateTime(article.publishedAt);
  const updatedAt = toIsoDateTime(article.updatedAt);
  const wordCount = article.sections.reduce(
    (count, section) =>
      count +
      section.paragraphs.join(" ").split(/\s+/).length +
      (section.bullets?.join(" ").split(/\s+/).length ?? 0),
    (article.intro?.join(" ").split(/\s+/).length ?? 0),
  );

  if (article.schema?.type === "TechArticle") {
    const { publisherOrganization, aboutApplication } = article.schema;
    const publisherId = `${publisherOrganization.url}#organization`;
    const applicationId = `${aboutApplication.url}#software`;
    const webpageId = `${url}#webpage`;
    const articleId = `${url}#article`;

    const schema = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "TechArticle",
          "@id": articleId,
          isPartOf: { "@id": webpageId },
          headline: article.title,
          description: article.description,
          inLanguage: "en-US",
          mainEntityOfPage: { "@id": webpageId },
          datePublished: publishedAt,
          dateModified: updatedAt,
          author: { "@type": "Organization", "@id": publisherId },
          publisher: { "@type": "Organization", "@id": publisherId },
          about: [{ "@type": "SoftwareApplication", "@id": applicationId }],
          keywords: article.keywords,
          wordCount,
        },
        {
          "@type": "WebPage",
          "@id": webpageId,
          url,
          name: article.title,
          isPartOf: { "@id": `${siteUrl}#website` },
        },
        {
          "@type": "Organization",
          "@id": publisherId,
          name: publisherOrganization.name,
          url: publisherOrganization.url,
          logo: {
            "@type": "ImageObject",
            url: publisherOrganization.logoUrl,
          },
          ...(publisherOrganization.sameAs?.length
            ? { sameAs: [...publisherOrganization.sameAs] }
            : {}),
        },
        {
          "@type": "SoftwareApplication",
          "@id": applicationId,
          name: aboutApplication.name,
          url: aboutApplication.url,
          applicationCategory: aboutApplication.applicationCategory,
          operatingSystem: aboutApplication.operatingSystem,
          description: aboutApplication.description,
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Home",
              item: siteUrl,
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "Guides",
              item: `${siteUrl}/guides`,
            },
            {
              "@type": "ListItem",
              position: 3,
              name: article.title,
              item: url,
            },
          ],
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

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${url}#article`,
        headline: article.title,
        description: article.description,
        datePublished: publishedAt,
        dateModified: updatedAt,
        inLanguage: "en-US",
        author: {
          "@type": "Organization",
          name: "ForgeRep",
          url: siteUrl,
        },
        publisher: {
          "@type": "Organization",
          name: "ForgeRep",
          url: siteUrl,
          logo: {
            "@type": "ImageObject",
            url: `${siteUrl}/logo-icon.svg`,
          },
        },
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": url,
        },
        keywords: article.keywords.join(", "),
        articleSection:
          article.category === "comparison" ? "App comparisons" : "Training guides",
        wordCount,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: siteUrl,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Guides",
            item: `${siteUrl}/guides`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: article.title,
            item: url,
          },
        ],
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
