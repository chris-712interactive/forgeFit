function InstallIcon({ className = "" }: { className?: string }) {
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
      <path d="M12 3v12" />
      <path d="m8 11 4 4 4-4" />
      <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
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

/** Chrome / Edge / Android-style install — shown when native prompt isn't available yet. */
export function GenericInstallGuide() {
  return (
    <div className="mt-3 space-y-3">
      <p className="text-sm text-forge-muted">
        Install ForgeRep for faster access and reliable offline workouts in the
        gym.
      </p>

      <div
        className="overflow-hidden rounded-xl border border-[var(--border)] bg-forge-surface"
        aria-hidden
      >
        <div className="flex items-center gap-2 border-b border-[var(--border)] bg-forge-surface-raised px-3 py-2">
          <div className="min-w-0 flex-1 truncate rounded-md bg-forge-surface px-2 py-1 text-center text-[10px] text-forge-muted">
            joinforgefit.com
          </div>
          <div className="relative flex shrink-0 items-center gap-1">
            <span className="absolute -inset-1.5 animate-pulse rounded-lg bg-forge-ember/25 ring-2 ring-forge-ember/60" />
            <span className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-forge-ember/15 text-forge-ember">
              <InstallIcon className="h-4 w-4" />
            </span>
          </div>
        </div>
        <div className="px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-forge-muted">
          Tap Install in the address bar (Chrome, Edge, or Samsung Internet)
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-forge-ember/30 bg-forge-surface-raised px-3 py-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-forge-ember/15">
            <img
              src="/logo-icon.svg"
              alt=""
              className="h-7 w-7"
              width={28}
              height={28}
            />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-forge-text">ForgeRep</p>
            <p className="text-xs text-forge-muted">
              Opens like an app · works offline in the gym
            </p>
          </div>
        </div>
      </div>

      <ol className="space-y-2.5">
        <li className="flex items-start gap-3">
          <StepBadge number={1} />
          <p className="pt-0.5 text-sm text-forge-muted">
            On <span className="font-medium text-forge-text">Android</span> or{" "}
            <span className="font-medium text-forge-text">desktop</span>, tap{" "}
            <span className="inline-flex translate-y-0.5 items-center gap-1 font-medium text-forge-ember">
              <InstallIcon className="h-3.5 w-3.5" />
              Install
            </span>{" "}
            when your browser offers it, or use the menu →{" "}
            <span className="font-medium text-forge-text">
              Install app / Add to Home screen
            </span>
            .
          </p>
        </li>
        <li className="flex items-start gap-3">
          <StepBadge number={2} />
          <p className="pt-0.5 text-sm text-forge-muted">
            On <span className="font-medium text-forge-text">iPhone</span>, use
            Share →{" "}
            <span className="font-medium text-forge-text">
              Add to Home Screen
            </span>{" "}
            in Safari or Chrome.
          </p>
        </li>
      </ol>
    </div>
  );
}
