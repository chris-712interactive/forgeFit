function ShareIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M12 3v10" />
      <path d="m8 7 4-4 4 4" />
      <rect x="4" y="11" width="16" height="10" rx="2" />
    </svg>
  );
}

function HomeScreenPlusIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      className={className}
      aria-hidden
    >
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}

function StepBadge({ number }: { number: number }) {
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-forge-ember/20 text-xs font-bold text-forge-ember">
      {number}
    </span>
  );
}

export function IosInstallGuide() {
  return (
    <div className="mt-3 space-y-3">
      <p className="text-sm text-forge-muted">
        Add ForgeRep to your Home Screen for faster access and reliable offline
        workouts in the gym.
      </p>

      {/* Mini browser chrome */}
      <div
        className="overflow-hidden rounded-xl border border-[var(--border)] bg-forge-surface"
        aria-hidden
      >
        <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] bg-forge-surface-raised px-3 py-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="text-forge-muted" aria-hidden>
              ‹
            </span>
            <div className="min-w-0 flex-1 truncate rounded-md bg-forge-surface px-2 py-1 text-center text-[10px] text-forge-muted">
              joinforgefit.com
            </div>
          </div>
          <div className="relative flex shrink-0 items-center">
            <span className="absolute -inset-1.5 animate-pulse rounded-lg bg-forge-ember/25 ring-2 ring-forge-ember/60" />
            <span className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-forge-ember/15 text-forge-ember">
              <ShareIcon className="h-4 w-4" />
            </span>
          </div>
        </div>
        <div className="px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-forge-muted">
          Tap Share in your browser (top or bottom toolbar)
        </div>
      </div>

      {/* Mock share sheet row */}
      <div
        className="overflow-hidden rounded-xl border border-forge-ember/30 bg-forge-surface-raised"
        aria-hidden
      >
        <div className="border-b border-[var(--border)] px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-forge-muted">
          In the menu, choose
        </div>
        <div className="flex items-center gap-3 px-3 py-3 ring-2 ring-inset ring-forge-ember/40">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-forge-ember/15 text-forge-ember">
            <HomeScreenPlusIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-forge-text">
              Add to Home Screen
            </p>
            <p className="text-xs text-forge-muted">Opens like a native app</p>
          </div>
        </div>
      </div>

      <ol className="space-y-2.5">
        <li className="flex items-start gap-3">
          <StepBadge number={1} />
          <p className="pt-0.5 text-sm text-forge-muted">
            Stay on this page in{" "}
            <span className="font-medium text-forge-text">Safari</span> or{" "}
            <span className="font-medium text-forge-text">Chrome</span> — both
            support Add to Home Screen on iPhone.
          </p>
        </li>
        <li className="flex items-start gap-3">
          <StepBadge number={2} />
          <p className="pt-0.5 text-sm text-forge-muted">
            Tap the{" "}
            <span className="inline-flex translate-y-0.5 items-center gap-1 font-medium text-forge-ember">
              <ShareIcon className="h-3.5 w-3.5" />
              Share
            </span>{" "}
            button — usually at the <span className="font-medium text-forge-text">top</span> in
            Chrome or the <span className="font-medium text-forge-text">bottom</span> in Safari
            (top on iPad).
          </p>
        </li>
        <li className="flex items-start gap-3">
          <StepBadge number={3} />
          <p className="pt-0.5 text-sm text-forge-muted">
            Scroll the sheet and tap{" "}
            <span className="font-medium text-forge-text">Add to Home Screen</span>,
            then tap <span className="font-medium text-forge-text">Add</span>.
          </p>
        </li>
      </ol>
    </div>
  );
}
