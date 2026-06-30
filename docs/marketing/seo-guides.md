# ForgeRep SEO Guides

Public, indexable articles at `/guides` for search discovery and comparison-intent traffic.

## Routes

| URL | Purpose |
|-----|---------|
| `/guides` | Index — training guides + app comparisons |
| `/guides/[slug]` | Individual article (SSG) |

## Adding an article

1. Add content to `apps/web/src/lib/seo/articles/guide-articles.ts` or `comparison-articles.ts`
2. Set `slug`, `title`, `description`, `keywords`, dates, and `relatedSlugs` for internal linking
3. Rebuild — `generateStaticParams` and `sitemap.ts` pull from the shared article index automatically

## SEO surface

- Per-article metadata via `buildArticleMetadata()` (`article-metadata.ts`)
- JSON-LD `Article` + `BreadcrumbList` on each page
- All guide URLs included in `/sitemap.xml`
- `robots.ts` allows crawling (app routes remain disallowed)

## Launch set (2026-06-28)

**Training guides:** offline workout tracker, evidence-based programs, macro tracking for lifters, progressive overload

**Comparisons:** vs Strong, Hevy, MyFitnessPal, MacroFactor, Fitbod

## Content guidelines

- Acknowledge competitor strengths — comparison pages should read honest, not promotional
- Link related guides via `relatedSlugs`
- Update `updatedAt` when materially revising an article
- Keep ForgeRep differentiators aligned with `docs/BIBLE.md` and landing copy
- Strategy roadmap vs MyFitnessPal: [mfp-differentiation.md](./mfp-differentiation.md)
