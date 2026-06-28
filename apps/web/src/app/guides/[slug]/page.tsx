import { ArticlePage } from "@/components/marketing/article-page";
import {
  getAllSeoArticleSlugs,
  getRelatedArticles,
  getSeoArticle,
} from "@/lib/seo/articles";
import { buildArticleMetadata } from "@/lib/seo/article-metadata";
import { notFound } from "next/navigation";

interface GuideArticlePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllSeoArticleSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: GuideArticlePageProps) {
  const { slug } = await params;
  const article = getSeoArticle(slug);

  if (!article) {
    return {};
  }

  return buildArticleMetadata(article);
}

export default async function GuideArticlePage({ params }: GuideArticlePageProps) {
  const { slug } = await params;
  const article = getSeoArticle(slug);

  if (!article) {
    notFound();
  }

  const relatedArticles = getRelatedArticles(slug);

  return <ArticlePage article={article} relatedArticles={relatedArticles} />;
}
