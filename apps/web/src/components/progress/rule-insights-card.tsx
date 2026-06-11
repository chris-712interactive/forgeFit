import type { RuleInsight } from "@/lib/analytics/types";

const TONE_STYLES: Record<
  RuleInsight["tone"],
  { border: string; badge: string }
> = {
  positive: {
    border: "border-forge-success/30 bg-forge-success/5",
    badge: "text-forge-success",
  },
  neutral: {
    border: "border-forge-steel/30 bg-forge-steel/5",
    badge: "text-forge-steel",
  },
  nudge: {
    border: "border-forge-gold/30 bg-forge-gold/5",
    badge: "text-forge-gold",
  },
};

interface RuleInsightsCardProps {
  insights: RuleInsight[];
}

export function RuleInsightsCard({ insights }: RuleInsightsCardProps) {
  if (insights.length === 0) {
    return (
      <p className="text-sm text-forge-muted">
        Keep logging workouts, nutrition, and measurements — insights appear as
        trends develop.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {insights.map((insight) => {
        const style = TONE_STYLES[insight.tone];
        return (
          <li
            key={insight.id}
            className={`rounded-xl border px-4 py-3 ${style.border}`}
          >
            <p className={`text-xs font-semibold uppercase tracking-wider ${style.badge}`}>
              Insight
            </p>
            <p className="mt-1 font-medium text-forge-text">{insight.title}</p>
            <p className="mt-1 text-sm text-forge-muted">{insight.body}</p>
          </li>
        );
      })}
    </ul>
  );
}
