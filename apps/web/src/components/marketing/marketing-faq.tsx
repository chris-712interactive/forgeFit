import { faqItems } from "./marketing-data";
import {
  MarketingPageSection,
  MarketingSectionIntro,
} from "./marketing-section";

export function MarketingFaq() {
  return (
    <MarketingPageSection id="faq" ariaLabelledBy="faq-heading">
      <MarketingSectionIntro
        headingId="faq-heading"
        eyebrow="Questions"
        eyebrowClassName="text-forge-steel"
        title="Frequently asked questions"
        description="Everything you need to know about ForgeRep — the workout tracker and macro app built for real training."
        align="center"
      />

      <div className="mx-auto mt-10 max-w-3xl space-y-3 sm:mt-12">
        {faqItems.map((item) => (
          <details
            key={item.question}
            className="group rounded-xl border border-[var(--border)] bg-forge-surface-raised open:border-forge-ember/30"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-display text-sm font-semibold text-forge-text marker:content-none sm:px-6 sm:py-5 sm:text-base [&::-webkit-details-marker]:hidden">
              {item.question}
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--border)] text-forge-muted transition-transform group-open:rotate-45"
                aria-hidden
              >
                +
              </span>
            </summary>
            <div className="border-t border-[var(--border)] px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
              <p className="text-sm leading-relaxed text-forge-muted sm:text-base">
                {item.answer}
              </p>
            </div>
          </details>
        ))}
      </div>
    </MarketingPageSection>
  );
}
