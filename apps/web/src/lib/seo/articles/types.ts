export type SeoArticleCategory = "guide" | "comparison";

export type SeoArticleSchemaType = "Article" | "TechArticle";

export interface ComparisonTableRow {
  feature: string;
  forgeRep: string;
  competitor: string;
}

export interface DataTable {
  headers: readonly string[];
  rows: readonly (readonly string[])[];
}

export interface SeoArticleSchemaConfig {
  type: SeoArticleSchemaType;
  publisherOrganization: {
    name: string;
    url: string;
    logoUrl: string;
    sameAs?: readonly string[];
  };
  aboutApplication: {
    name: string;
    url: string;
    description: string;
    applicationCategory: string;
    operatingSystem: string;
  };
}

export interface SeoArticleSection {
  id?: string;
  heading: string;
  paragraphs: readonly string[];
  bullets?: readonly string[];
  flowDiagram?: string;
  comparisonTable?: {
    competitorName: string;
    rows: readonly ComparisonTableRow[];
  };
  dataTable?: DataTable;
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
  intro?: readonly string[];
  schema?: SeoArticleSchemaConfig;
  sections: readonly SeoArticleSection[];
}
