import Link from "next/link";
import {
  guideCategoryLabel,
  type SeoArticle,
} from "@/lib/seo/articles";
import { MarketingCtaButtons } from "./marketing-cta-buttons";
import { MarketingFooter } from "./marketing-footer";
import { MarketingHeader } from "./marketing-header";
import { ArticleJsonLd } from "./article-json-ld";
import { marketingContentClass } from "./marketing-section";

function formatArticleDate(isoDate: string): string {
  return new Date(`${isoDate}T12:00:00`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function ComparisonTable({
  competitorName,
  rows,
}: {
  competitorName: string;
  rows: NonNullable<
    SeoArticle["sections"][number]["comparisonTable"]
  >["rows"];
}) {
  return (
    <div className="mt-6 overflow-x-auto rounded-xl border border-[var(--border)]">
      <table className="w-full min-w-[560px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] bg-forge-surface-raised">
            <th className="px-4 py-3 font-display font-semibold text-forge-text">
              Feature
            </th>
            <th className="px-4 py-3 font-display font-semibold text-forge-ember">
              ForgeRep
            </th>
            <th className="px-4 py-3 font-display font-semibold text-forge-text">
              {competitorName}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.feature}
              className="border-b border-[var(--border)] last:border-b-0"
            >
              <th
                scope="row"
                className="px-4 py-3 font-medium text-forge-text"
              >
                {row.feature}
              </th>
              <td className="px-4 py-3 text-forge-muted">{row.forgeRep}</td>
              <td className="px-4 py-3 text-forge-muted">{row.competitor}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface ArticlePageProps {
  article: SeoArticle;
  relatedArticles: SeoArticle[];
}

export function ArticlePage({ article, relatedArticles }: ArticlePageProps) {
  return (
    <>
      <ArticleJsonLd article={article} />

      <div className="flex min-h-dvh flex-col bg-forge-surface text-forge-text">
        <MarketingHeader />

        <main className="flex-1 py-10 sm:py-12 md:py-14">
          <article className={marketingContentClass}>
            <nav aria-label="Breadcrumb" className="text-sm text-forge-muted">
              <ol className="flex flex-wrap items-center gap-2">
                <li>
                  <Link href="/" className="transition-colors hover:text-forge-ember">
                    Home
                  </Link>
                </li>
                <li aria-hidden>/</li>
                <li>
                  <Link
                    href="/guides"
                    className="transition-colors hover:text-forge-ember"
                  >
                    Guides
                  </Link>
                </li>
                <li aria-hidden>/</li>
                <li className="text-forge-text">{guideCategoryLabel[article.category]}</li>
              </ol>
            </nav>

            <header className="mt-6 border-b border-[var(--border)] pb-8 sm:mt-8">
              <p className="font-display text-xs font-semibold uppercase tracking-wider text-forge-ember sm:text-sm">
                {guideCategoryLabel[article.category]}
              </p>
              <h1 className="mt-3 font-display text-3xl font-bold leading-tight text-forge-text sm:text-4xl md:text-[2.5rem]">
                {article.title}
              </h1>
              <p className="mt-4 max-w-prose text-base leading-relaxed text-forge-muted sm:text-lg">
                {article.description}
              </p>
              <p className="mt-4 text-sm text-forge-muted">
                Updated {formatArticleDate(article.updatedAt)} ·{" "}
                {article.readTimeMinutes} min read
              </p>
            </header>

            <div className="mt-10 space-y-12 sm:mt-12">
              {article.sections.map((section) => (
                <section key={section.heading} id={section.id}>
                  <h2 className="font-display text-xl font-semibold text-forge-text sm:text-2xl">
                    {section.heading}
                  </h2>

                  {section.paragraphs.length > 0 && (
                    <div className="mt-4 space-y-4">
                      {section.paragraphs.map((paragraph, index) => (
                        <p
                          key={index}
                          className="text-base leading-relaxed text-forge-muted"
                        >
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  )}

                  {section.bullets && section.bullets.length > 0 && (
                    <ul className="mt-4 list-disc space-y-2 pl-5 text-base leading-relaxed text-forge-muted">
                      {section.bullets.map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>
                  )}

                  {section.comparisonTable && (
                    <ComparisonTable
                      competitorName={section.comparisonTable.competitorName}
                      rows={section.comparisonTable.rows}
                    />
                  )}
                </section>
              ))}
            </div>

            <aside className="mt-12 rounded-2xl border border-forge-ember/30 bg-gradient-to-br from-forge-ember/10 via-forge-surface-raised to-forge-surface p-6 sm:p-8">
              <h2 className="font-display text-xl font-bold text-forge-text sm:text-2xl">
                Try ForgeRep free
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-forge-muted sm:text-base">
                Personalized programs, offline gym logging, macro tracking, and
                30-day projections — no credit card required.
              </p>
              <div className="mt-6 max-w-md">
                <MarketingCtaButtons signupLabel="Get Started Free" />
              </div>
            </aside>

            {relatedArticles.length > 0 && (
              <aside className="mt-12 border-t border-[var(--border)] pt-10">
                <h2 className="font-display text-lg font-semibold text-forge-text sm:text-xl">
                  Related guides
                </h2>
                <ul className="mt-4 space-y-3">
                  {relatedArticles.map((related) => (
                    <li key={related.slug}>
                      <Link
                        href={`/guides/${related.slug}`}
                        className="group block rounded-xl border border-[var(--border)] bg-forge-surface-raised p-4 transition-colors hover:border-forge-ember/40"
                      >
                        <p className="text-xs font-semibold uppercase tracking-wider text-forge-ember">
                          {guideCategoryLabel[related.category]}
                        </p>
                        <p className="mt-1 font-display font-semibold text-forge-text group-hover:text-forge-ember">
                          {related.title}
                        </p>
                        <p className="mt-2 text-sm text-forge-muted line-clamp-2">
                          {related.description}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </aside>
            )}
          </article>
        </main>

        <MarketingFooter />
      </div>
    </>
  );
}
