"use client";

import type {
  AdminCommunityModerationData,
  AdminFlaggedScoreRow,
  AdminModerationWinRow,
} from "@/lib/admin/community-moderation";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface AdminCommunityModerationPanelProps {
  data: AdminCommunityModerationData;
}

async function postModerationAction(body: Record<string, unknown>): Promise<void> {
  const response = await fetch("/api/admin/community/moderation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const payload = (await response.json()) as { error?: string };
  if (!response.ok) {
    throw new Error(payload.error ?? "Moderation action failed.");
  }
}

function bucketLabel(goal: string, experience: string): string {
  return `${goal.replaceAll("_", " ")} · ${experience}`;
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function AdminCommunityModerationPanel({
  data,
}: AdminCommunityModerationPanelProps) {
  const router = useRouter();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runAction(key: string, action: () => Promise<void>) {
    setBusyKey(key);
    setError(null);

    try {
      await action();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <p className="rounded-xl border border-forge-coral/30 bg-forge-coral/5 px-4 py-3 text-sm text-forge-coral">
          {error}
        </p>
      )}

      <FlaggedScoresSection
        rows={data.flaggedScores}
        busyKey={busyKey}
        onClearFlag={(row) =>
          runAction(`clear-${row.id}`, () =>
            postModerationAction({
              action: "clear_score_flag",
              scoreId: row.id,
            }),
          )
        }
        onSuspend={(row) => {
          const reason = window.prompt(
            `Suspend ${row.displayLabel} from community? Optional note:`,
          );
          if (reason === null) return Promise.resolve();
          return runAction(`suspend-${row.userId}`, () =>
            postModerationAction({
              action: "suspend_user",
              userId: row.userId,
              reason,
            }),
          );
        }}
      />

      <WinsSection
        rows={data.wins}
        busyKey={busyKey}
        onHide={(row) => {
          const reason = window.prompt(
            `Hide win from feed? Optional note for audit log:`,
          );
          if (reason === null) return Promise.resolve();
          return runAction(`hide-${row.id}`, () =>
            postModerationAction({
              action: "hide_win",
              winId: row.id,
              reason,
            }),
          );
        }}
        onUnhide={(row) =>
          runAction(`unhide-${row.id}`, () =>
            postModerationAction({
              action: "unhide_win",
              winId: row.id,
            }),
          )
        }
        onSuspend={(row) => {
          const reason = window.prompt(
            `Suspend ${row.displayLabel} from community? Optional note:`,
          );
          if (reason === null) return Promise.resolve();
          return runAction(`suspend-win-${row.userId}`, () =>
            postModerationAction({
              action: "suspend_user",
              userId: row.userId,
              reason,
            }),
          );
        }}
      />
    </div>
  );
}

function FlaggedScoresSection({
  rows,
  busyKey,
  onClearFlag,
  onSuspend,
}: {
  rows: AdminFlaggedScoreRow[];
  busyKey: string | null;
  onClearFlag: (row: AdminFlaggedScoreRow) => Promise<void>;
  onSuspend: (row: AdminFlaggedScoreRow) => Promise<void>;
}) {
  return (
    <section className="rounded-2xl border border-forge-coral/30 bg-forge-surface-raised p-4 sm:p-5">
      <h2 className="font-display text-sm font-semibold text-forge-text">
        Flagged scores
      </h2>
      <p className="mt-1 text-xs text-forge-muted">
        All buckets — review habit scores flagged for unusual activity.
      </p>

      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-forge-muted">No flagged scores right now.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {rows.map((row) => {
            const key = `flag-${row.id}`;
            return (
              <li
                key={key}
                className="rounded-xl border border-white/10 bg-forge-surface px-3 py-2.5"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-forge-text">
                      <Link
                        href={`/admin/users/${row.userId}`}
                        className="text-forge-steel hover:underline"
                      >
                        {row.displayLabel}
                      </Link>
                    </p>
                    <p className="text-xs text-forge-muted">
                      Score {row.habitScore} · week {row.weekStart}
                    </p>
                    <p className="text-xs text-forge-muted">
                      {bucketLabel(row.bucketGoal, row.bucketExperience)}
                      {row.flagReason ? ` · ${row.flagReason}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      disabled={busyKey != null}
                      onClick={() => void onClearFlag(row)}
                      className="rounded-lg border border-forge-gold/35 px-2.5 py-1 text-[11px] font-medium text-forge-gold hover:bg-forge-gold/10 disabled:opacity-60"
                    >
                      Clear flag
                    </button>
                    <button
                      type="button"
                      disabled={busyKey != null}
                      onClick={() => void onSuspend(row)}
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
      )}
    </section>
  );
}

function WinsSection({
  rows,
  busyKey,
  onHide,
  onUnhide,
  onSuspend,
}: {
  rows: AdminModerationWinRow[];
  busyKey: string | null;
  onHide: (row: AdminModerationWinRow) => Promise<void>;
  onUnhide: (row: AdminModerationWinRow) => Promise<void>;
  onSuspend: (row: AdminModerationWinRow) => Promise<void>;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-forge-surface-raised p-4 sm:p-5">
      <h2 className="font-display text-sm font-semibold text-forge-text">
        This week&apos;s wins
      </h2>
      <p className="mt-1 text-xs text-forge-muted">
        All buckets — hidden wins stay visible here for review.
      </p>

      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-forge-muted">No wins posted this week.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {rows.map((row) => {
            const hidden = Boolean(row.hiddenAt);
            return (
              <li
                key={row.id}
                className={`rounded-xl border px-3 py-2.5 ${
                  hidden
                    ? "border-forge-coral/25 bg-forge-coral/5"
                    : "border-white/10 bg-forge-surface"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-forge-text">
                      <Link
                        href={`/admin/users/${row.userId}`}
                        className="text-forge-steel hover:underline"
                      >
                        {row.displayLabel}
                      </Link>
                      {hidden ? (
                        <span className="ml-2 text-[10px] font-semibold uppercase tracking-wider text-forge-coral">
                          Hidden
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-0.5 text-sm text-forge-text">{row.headline}</p>
                    {row.detail && (
                      <p className="mt-0.5 text-xs text-forge-muted">{row.detail}</p>
                    )}
                    <p className="mt-1 text-xs text-forge-muted">
                      {bucketLabel(row.bucketGoal, row.bucketExperience)} ·{" "}
                      {formatWhen(row.occurredAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {hidden ? (
                      <button
                        type="button"
                        disabled={busyKey != null}
                        onClick={() => void onUnhide(row)}
                        className="rounded-lg border border-forge-gold/35 px-2.5 py-1 text-[11px] font-medium text-forge-gold hover:bg-forge-gold/10 disabled:opacity-60"
                      >
                        Unhide
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={busyKey != null}
                        onClick={() => void onHide(row)}
                        className="rounded-lg border border-forge-coral/35 px-2.5 py-1 text-[11px] font-medium text-forge-coral hover:bg-forge-coral/10 disabled:opacity-60"
                      >
                        Hide
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={busyKey != null}
                      onClick={() => void onSuspend(row)}
                      className="rounded-lg border border-white/10 px-2.5 py-1 text-[11px] font-medium text-forge-muted hover:text-forge-text disabled:opacity-60"
                    >
                      Suspend user
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
