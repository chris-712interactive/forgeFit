import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-forge-surface px-6 text-center">
      <p className="font-display text-sm font-semibold uppercase tracking-widest text-forge-gold">
        Offline
      </p>
      <h1 className="font-display mt-2 text-2xl font-bold text-forge-text">
        You&apos;re off the grid
      </h1>
      <p className="mt-3 max-w-sm text-forge-muted">
        ForgeFit still works — open Workout to log sets. Changes sync when
        signal returns.
      </p>
      <Link
        href="/workout"
        className="mt-8 flex min-h-[52px] w-full max-w-xs items-center justify-center rounded-xl bg-forge-ember font-display font-bold text-white"
      >
        Go to Workout
      </Link>
    </div>
  );
}
