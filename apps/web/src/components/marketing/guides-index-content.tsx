import Link from "next/link";
import {
  getSeoArticlesByCategory,
  guideCategoryLabel,
  type SeoArticle,
} from "@/lib/seo/articles";
import { MarketingFooter } from "./marketing-footer";
import { MarketingHeader } from "./marketing-header";
import {
  MarketingPageSection,
  MarketingSectionIntro,
  marketingWideClass,
} from "./marketing-section";

function ArticleCard({ article }: { article: SeoArticle }) {
  return (
    <Link
      href={`/guides/${article.slug}`}
      className="group flex h-full flex-col rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-5 transition-colors hover:border-forge-ember/40 sm:p-6"
    >
      <p className="font-display text-xs font-semibold uppercase tracking-wider text-forge-ember">
        {guideCategoryLabel[article.category]}
      </p>
      <h3 className="mt-2 font-display text-lg font-semibold leading-snug text-forge-text group-hover:text-forge-ember sm:text-xl">
        {article.title}
      </h3>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-forge-muted">
        {article.description}
      </p>
      <p className="mt-4 text-xs text-forge-muted">
        {article.readTimeMinutes} min read
      </p>
    </Link>
  );
}

function ArticleSection({
  id,
  eyebrow,
  title,
  description,
  articles,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  articles: readonly SeoArticle[];
}) {
  if (articles.length === 0) return null;

  return (
    <MarketingPageSection id={id} ariaLabelledBy={`${id}-heading`}>
      <MarketingSectionIntro
        headingId={`${id}-heading`}
        eyebrow={eyebrow}
        title={title}
        description={description}
      />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
        {articles.map((article) => (
          <ArticleCard key={article.slug} article={article} />
        ))}
      </div>
    </MarketingPageSection>
  );
}

export function GuidesIndexContent() {
  const guides = getSeoArticlesByCategory("guide");
  const comparisons = getSeoArticlesByCategory("comparison");

  return (
    <div className="flex min-h-dvh flex-col bg-forge-surface text-forge-text">
      <MarketingHeader />

      <main className="flex-1 pb-16 pt-10 sm:pb-20 sm:pt-12 md:pb-24">
        <div className={`${marketingWideClass} max-w-4xl`}>
          <p className="font-display text-xs font-semibold uppercase tracking-wider text-forge-ember sm:text-sm">
            Resources
          </p>
          <h1 className="mt-3 font-display text-3xl font-bold leading-tight text-forge-text sm:text-4xl md:text-[2.75rem]">
            Fitness guides & app comparisons
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-forge-muted sm:text-lg">
            Evidence-based training advice, macro tracking tips, and honest
            comparisons — written for lifters evaluating their next fitness app.
          </p>
        </div>

        <div className="mt-12 flex flex-col gap-16 sm:mt-14 sm:gap-20 md:gap-24">
          <ArticleSection
            id="training-guides"
            eyebrow="Training guides"
            title="Problems ForgeRep solves"
            description="Practical guides on offline logging, evidence-based programming, macro tracking, and progressive overload."
            articles={guides}
          />

          <ArticleSection
            id="comparisons"
            eyebrow="Comparisons"
            title="How ForgeRep compares"
            description="Side-by-side looks at ForgeRep vs popular workout and nutrition apps — with credit where competitors excel."
            articles={comparisons}
          />
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
