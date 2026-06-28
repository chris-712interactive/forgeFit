export type SeoArticleCategory = "guide" | "comparison";

export interface ComparisonTableRow {
  feature: string;
  forgeRep: string;
  competitor: string;
}

export interface SeoArticleSection {
  id?: string;
  heading: string;
  paragraphs: readonly string[];
  bullets?: readonly string[];
  comparisonTable?: {
    competitorName: string;
    rows: readonly ComparisonTableRow[];
  };
}

export interface SeoArticle {
  slug: string;
  category: SeoArticleCategory;
  title: string;
  description: string;
  keywords: readonly string[];
  publishedAt: string;
  updatedAt: string;
  readTimeMinutes: number;
  relatedSlugs: readonly string[];
  sections: readonly SeoArticleSection[];
}
