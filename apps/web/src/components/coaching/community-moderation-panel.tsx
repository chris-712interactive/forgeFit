"use client";

import {
  moderateClearScoreFlag,
  moderateHideWin,
  moderateSetSuspended,
  moderateUnhideWin,
} from "@/app/actions/community";
import type { ModerationQueue } from "@/lib/coaching/types";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface CommunityModerationPanelProps {
  queue: ModerationQueue;
}

export function CommunityModerationPanel({
  queue,
}: CommunityModerationPanelProps) {
  const router = useRouter();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runAction(key: string, action: () => Promise<{ ok: boolean; error?: string }>) {
    setBusyKey(key);
    setError(null);
    const result = await action();
    setBusyKey(null);

    if (!result.ok) {
      setError(result.error ?? "Action failed.");
      return;
    }

    router.refresh();
  }

  const hasItems =
    queue.flaggedScores.length > 0 || queue.recentWins.length > 0;

  return (
    <section className="rounded-2xl border border-forge-coral/30 bg-forge-surface p-4 sm:p-5">
      <h3 className="font-display text-sm font-semibold text-forge-text">
        Moderation
      </h3>
      <p className="mt-1 text-xs text-forge-muted">
        Review flagged scores and wins in your bucket. Actions are logged.
      </p>

      {error && <p className="mt-2 text-xs text-forge-coral">{error}</p>}

      {!hasItems && (
        <p className="mt-4 text-sm text-forge-muted">Nothing to review right now.</p>
      )}

      {queue.flaggedScores.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-forge-muted">
            Flagged scores
          </p>
          <ul className="space-y-2">
            {queue.flaggedScores.map((row) => {
              const key = `flag-${row.userId}`;
              return (
                <li
                  key={key}
                  className="rounded-xl border border-[var(--border)] bg-forge-surface-raised px-3 py-2.5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-forge-text">
                        {row.displayLabel}
                      </p>
                      <p className="text-xs text-forge-muted">
                        Score {row.habitScore}
                        {row.flagReason ? ` · ${row.flagReason}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        disabled={busyKey != null}
                        onClick={() =>
                          void runAction(key, () =>
                            moderateClearScoreFlag({
                              targetUserId: row.userId,
                              weekStart: row.weekStart,
                            })
                          )
                        }
                        className="rounded-lg border border-forge-gold/35 px-2.5 py-1 text-[11px] font-medium text-forge-gold hover:bg-forge-gold/10 disabled:opacity-60"
                      >
                        Clear flag
                      </button>
                      <button
                        type="button"
                        disabled={busyKey != null}
                        onClick={() =>
                          void runAction(`${key}-suspend`, () =>
                            moderateSetSuspended({
                              targetUserId: row.userId,
                              suspended: true,
                            })
                          )
                        }
                        className="rounded-lg border border-forge-coral/35 px-2.5 py-1 text-[11px] font-medium text-forge-coral hover:bg-forge-coral/10 disabled:opacity-60"
                      >
                        Suspend
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {queue.recentWins.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-forge-muted">
            Recent wins
          </p>
          <ul className="space-y-2">
            {queue.recentWins.map((win) => {
              const key = `win-${win.id}`;
              const hidden = Boolean(win.hiddenAt);
              return (
                <li
                  key={win.id}
                  className={`rounded-xl border px-3 py-2.5 ${
                    hidden
                      ? "border-forge-coral/30 bg-forge-coral/5"
                      : "border-[var(--border)] bg-forge-surface-raised"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-forge-text">
                        {win.displayLabel}
                        {hidden ? " · hidden" : ""}
                      </p>
                      <p className="text-xs text-forge-gold">{win.headline}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {hidden ? (
                        <button
                          type="button"
                          disabled={busyKey != null}
                          onClick={() =>
                            void runAction(key, () => moderateUnhideWin(win.id))
                          }
                          className="rounded-lg border border-forge-gold/35 px-2.5 py-1 text-[11px] font-medium text-forge-gold hover:bg-forge-gold/10 disabled:opacity-60"
                        >
                          Unhide
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={busyKey != null}
                          onClick={() =>
                            void runAction(key, () => moderateHideWin(win.id))
                          }
                          className="rounded-lg border border-forge-coral/35 px-2.5 py-1 text-[11px] font-medium text-forge-coral hover:bg-forge-coral/10 disabled:opacity-60"
                        >
                          Hide
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={busyKey != null}
                        onClick={() =>
                          void runAction(`${key}-suspend`, () =>
                            moderateSetSuspended({
                              targetUserId: win.userId,
                              suspended: true,
                            })
                          )
                        }
                        className="rounded-lg border border-[var(--border)] px-2.5 py-1 text-[11px] font-medium text-forge-muted hover:text-forge-text disabled:opacity-60"
                      >
                        Suspend user
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
