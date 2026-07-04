import Link from "next/link";
import type { ReactNode } from "react";

interface HomeDomainCardProps {
  title: string;
  titleClassName: string;
  href: string;
  linkLabel: string;
  headline: ReactNode;
  subline: string;
  chart: ReactNode;
  chartCaption: string;
}

export function HomeDomainCard({
  title,
  titleClassName,
  href,
  linkLabel,
  headline,
  subline,
  chart,
  chartCaption,
}: HomeDomainCardProps) {
  return (
    <Link
      href={href}
      className="flex h-full min-h-[248px] flex-col rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4 transition-colors hover:border-forge-ember/35"
    >
      <div className="flex items-center justify-between gap-3">
        <h3
          className={`font-display text-[11px] font-semibold uppercase tracking-wider ${titleClassName}`}
        >
          {title}
        </h3>
        <span className="text-[11px] font-semibold text-forge-steel">{linkLabel}</span>
      </div>

      <div className="mt-3">
        <p className="font-display text-[28px] font-bold leading-tight tabular-nums text-forge-text">
          {headline}
        </p>
        <p className="mt-1 text-sm leading-snug text-forge-muted">{subline}</p>
      </div>

      <div className="mt-3 min-h-0 flex-1">{chart}</div>

      <p className="mt-2 text-[10px] leading-snug text-forge-muted">{chartCaption}</p>
    </Link>
  );
}
