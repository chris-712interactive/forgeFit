import type { HallOfFameEntry } from "@/lib/coaching/types";

interface HallOfFameCardProps {
  entries: HallOfFameEntry[];
  bucketLabel?: string | null;
}

export function HallOfFameCard({ entries, bucketLabel }: HallOfFameCardProps) {
  if (entries.length === 0) {
    return null;
  }

  const bySeason = new Map<string, HallOfFameEntry[]>();
  for (const entry of entries) {
    const list = bySeason.get(entry.seasonMonth) ?? [];
    list.push(entry);
    bySeason.set(entry.seasonMonth, list);
  }

  const seasons = [...bySeason.entries()].slice(0, 4);

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4 sm:p-5">
      <div>
        <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-muted">
          Hall of fame
        </h2>
        <p className="mt-1 text-xs text-forge-muted">
          Monthly bucket champions
          {bucketLabel ? ` · ${bucketLabel}` : ""}
        </p>
      </div>

      <div className="mt-4 space-y-4">
        {seasons.map(([seasonMonth, seasonEntries]) => (
          <div key={seasonMonth}>
            <p className="text-xs font-semibold text-forge-text">
              {seasonEntries[0]?.seasonLabel}
            </p>
            <ol className="mt-2 space-y-1.5">
              {[...seasonEntries]
                .sort((a, b) => a.rank - b.rank)
                .map((entry) => (
                  <li
                    key={`${seasonMonth}-${entry.rank}`}
                    className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm ${
                      entry.isCurrentUser
                        ? "border-forge-gold/40 bg-forge-surface"
                        : "border-[var(--border)] bg-forge-surface/60"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="font-display font-bold text-forge-gold">
                        #{entry.rank}
                      </span>
                      <span className="text-forge-text">{entry.displayLabel}</span>
                      {entry.isCurrentUser && (
                        <span className="text-[10px] uppercase text-forge-muted">
                          You
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-forge-muted">
                      {entry.avgHabitScore} avg
                    </span>
                  </li>
                ))}
            </ol>
          </div>
        ))}
      </div>
    </section>
  );
}
