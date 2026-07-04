"use client";

import { HomeDomainCards } from "@/components/home/home-domain-cards";
import type { HomeDashboardData } from "@/lib/home/types";
import { useCallback, useRef, useState } from "react";

const CARD_IDS = ["training", "nutrition", "progress", "activity", "community"] as const;

interface HomeDomainCarouselProps {
  data: HomeDashboardData;
}

export function HomeDomainCarousel({ data }: HomeDomainCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const scrollToIndex = useCallback((index: number) => {
    const container = scrollRef.current;
    if (!container) return;
    const card = container.children[index] as HTMLElement | undefined;
    if (!card) return;
    container.scrollTo({ left: card.offsetLeft - 4, behavior: "smooth" });
    setActiveIndex(index);
  }, []);

  const handleScroll = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;
    const cards = Array.from(container.children) as HTMLElement[];
    if (cards.length === 0) return;

    const scrollLeft = container.scrollLeft + container.clientWidth * 0.15;
    let nearest = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    cards.forEach((card, index) => {
      const distance = Math.abs(card.offsetLeft - scrollLeft);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = index;
      }
    });

    setActiveIndex(nearest);
  }, []);

  return (
    <section aria-label="Your week">
      <div className="mb-2 flex items-baseline justify-between gap-3 px-0.5">
        <h2 className="font-display text-[11px] font-semibold uppercase tracking-wider text-forge-muted">
          Your week
        </h2>
        <p className="text-[10px] text-forge-muted">Swipe for more</p>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <HomeDomainCards data={data} />
      </div>

      <div className="mt-3 flex items-center justify-center gap-1.5" role="tablist" aria-label="Domain cards">
        {CARD_IDS.map((id, index) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={activeIndex === index}
            aria-label={id}
            onClick={() => scrollToIndex(index)}
            className={`h-1.5 rounded-full transition-all ${
              activeIndex === index
                ? "w-4 bg-forge-ember"
                : "w-1.5 bg-forge-muted/40 hover:bg-forge-muted/70"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
