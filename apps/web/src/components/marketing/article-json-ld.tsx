import type { SeoArticle } from "@/lib/seo/articles";
import { getSiteUrl } from "@/lib/seo/site-url";

export function ArticleJsonLd({ article }: { article: SeoArticle }) {
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}/guides/${article.slug}`;

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${url}#article`,
        headline: article.title,
        description: article.description,
        datePublished: article.publishedAt,
        dateModified: article.updatedAt,
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
        wordCount: article.sections.reduce(
          (count, section) =>
            count +
            section.paragraphs.join(" ").split(/\s+/).length +
            (section.bullets?.join(" ").split(/\s+/).length ?? 0),
          0,
        ),
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
