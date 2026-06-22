import Link from "next/link";

export function HomeProgressShortcut() {
  return (
    <Link
      href="/progress"
      className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4 transition-colors hover:border-forge-ember/40 sm:p-5"
    >
      <div className="min-w-0">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-muted">
          Progress
        </h2>
        <p className="mt-1 text-sm text-forge-text">
          Weight trends, strength charts, measurements & photos
        </p>
      </div>
      <span
        className="shrink-0 text-sm font-semibold text-forge-ember"
        aria-hidden
      >
        →
      </span>
    </Link>
  );
}
