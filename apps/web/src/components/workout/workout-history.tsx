import type { WorkoutHistoryItem } from "@/lib/workouts/history";

interface WorkoutHistoryProps {
  items: WorkoutHistoryItem[];
}

export function WorkoutHistory({ items }: WorkoutHistoryProps) {
  if (items.length === 0) {
    return (
      <section className="mt-8">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-muted">
          Recent workouts
        </h2>
        <p className="mt-2 text-sm text-forge-muted">
          Completed workouts will appear here after they sync to your account.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-8 space-y-3">
      <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-muted">
        Recent workouts
      </h2>
      {items.map((item) => (
        <article
          key={item.id}
          className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-display font-semibold text-forge-text">
                {item.sessionName}
              </p>
              <p className="mt-1 text-sm text-forge-muted">
                {formatDate(item.startedAt)}
                {item.completedSetCount > 0 &&
                  ` · ${item.completedSetCount}/${item.setCount} sets logged`}
                {item.pendingSync && " · Saved on this device"}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-lg px-2 py-1 text-xs font-semibold capitalize ${
                item.status === "completed"
                  ? "bg-forge-success/15 text-forge-success"
                  : "bg-forge-gold/15 text-forge-gold"
              }`}
            >
              {item.status.replace(/_/g, " ")}
            </span>
          </div>
        </article>
      ))}
    </section>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
