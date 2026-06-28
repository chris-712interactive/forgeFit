import Link from "next/link";
import { seoContentSections } from "./marketing-data";
import {
  MarketingPageSection,
  MarketingSectionIntro,
} from "./marketing-section";

export function MarketingSeoContent() {
  return (
    <MarketingPageSection ariaLabelledBy="seo-content-heading">
      <MarketingSectionIntro
        headingId="seo-content-heading"
        eyebrow="Built for serious training"
        title="More than a workout log — a complete fitness system"
        description="ForgeRep combines personalized programming, nutrition accountability, and progress tracking in one evidence-based fitness app."
        align="center"
      />

      <article className="mx-auto mt-10 max-w-3xl space-y-10 sm:mt-12 sm:space-y-12">
        {seoContentSections.map((section) => (
          <section key={section.id} id={section.id} className="space-y-4">
            <h3 className="font-display text-lg font-bold text-forge-text sm:text-xl">
              {section.heading}
            </h3>
            {section.paragraphs.map((paragraph) => (
              <p
                key={paragraph.slice(0, 40)}
                className="text-sm leading-relaxed text-forge-muted sm:text-base sm:leading-relaxed"
              >
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </article>

      <p className="mx-auto mt-10 max-w-3xl text-center text-sm text-forge-muted sm:text-base">
        <Link href="/guides" className="font-semibold text-forge-ember hover:underline">
          Read fitness guides & app comparisons →
        </Link>
      </p>
    </MarketingPageSection>
  );
}
