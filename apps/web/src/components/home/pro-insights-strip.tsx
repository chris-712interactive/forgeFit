import type { RuleInsight } from "@/lib/analytics/types";
import Link from "next/link";

interface ProInsightsStripProps {
  insights: RuleInsight[];
}

export function ProInsightsStrip({ insights }: ProInsightsStripProps) {
  if (insights.length === 0) return null;

  const top = insights.slice(0, 2);

  return (
    <section className="rounded-2xl border border-forge-gold/30 bg-forge-gold/5 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-muted">
          Pro insights
        </h2>
        <Link
          href="/progress"
          className="text-xs font-medium text-forge-ember hover:underline"
        >
          View all
        </Link>
      </div>
      <ul className="mt-3 space-y-2">
        {top.map((insight) => (
          <li key={insight.id} className="text-sm">
            <span className="font-medium text-forge-text">{insight.title}</span>
            <span className="text-forge-muted"> — {insight.body}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
