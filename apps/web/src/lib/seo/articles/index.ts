import { comparisonArticles } from "./comparison-articles";
import { guideArticles } from "./guide-articles";
import type { SeoArticle, SeoArticleCategory } from "./types";

export type { SeoArticle, SeoArticleCategory } from "./types";

export const seoArticles: readonly SeoArticle[] = [
  ...guideArticles,
  ...comparisonArticles,
];

const articlesBySlug = new Map(seoArticles.map((article) => [article.slug, article]));

export function getSeoArticle(slug: string): SeoArticle | undefined {
  return articlesBySlug.get(slug);
}

export function getAllSeoArticleSlugs(): string[] {
  return seoArticles.map((article) => article.slug);
}

export function getSeoArticlesByCategory(
  category: SeoArticleCategory,
): readonly SeoArticle[] {
  return seoArticles.filter((article) => article.category === category);
}

export function getRelatedArticles(slug: string): SeoArticle[] {
  const article = getSeoArticle(slug);
  if (!article) return [];

  return article.relatedSlugs
    .map((relatedSlug) => getSeoArticle(relatedSlug))
    .filter((related): related is SeoArticle => related !== undefined);
}

export const guideCategoryLabel: Record<SeoArticleCategory, string> = {
  guide: "Training guide",
  comparison: "App comparison",
};
