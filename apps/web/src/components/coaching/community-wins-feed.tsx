"use client";

import { CommunityWinInteractions } from "@/components/coaching/community-win-interactions";
import { CommunityWinModerationControls } from "@/components/coaching/community-win-moderation-controls";
import { useUnitPreference } from "@/components/units/unit-preference-provider";
import {
  formatCommunityWinDetail,
  winTypeLabel,
} from "@/lib/coaching/community-labels";
import type { GamificationContext } from "@/lib/coaching/types";
import Link from "next/link";

interface CommunityWinsFeedProps {
  gamification: GamificationContext;
  preview?: boolean;
  compact?: boolean;
  maxItems?: number;
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function CommunityWinsFeed({
  gamification,
  preview = false,
  compact = false,
  maxItems,
}: CommunityWinsFeedProps) {
  const unit = useUnitPreference();

  if (!gamification.unlocked) {
    return null;
  }

  const wins = maxItems
    ? gamification.communityWins.slice(0, maxItems)
    : gamification.communityWins;
  const hasWins = wins.length > 0;
  const showModerationControls =
    gamification.isModerator && !preview && !compact;

  return (
    <section
      className={
        compact
          ? "rounded-2xl border border-[var(--border)] bg-forge-surface-raised/80 p-3.5"
          : "rounded-2xl border border-[var(--border)] bg-forge-surface p-4 sm:p-5"
      }
    >
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-display text-sm font-semibold text-forge-text">
          Recent wins
        </h3>
        {compact && gamification.communityWins.length > wins.length && (
          <Link
            href="/community"
            className="text-xs font-medium text-forge-ember underline-offset-2 hover:underline"
          >
            More
          </Link>
        )}
      </div>
      {!compact && (
        <p className="mt-1 text-xs text-forge-muted">
          PRs and milestones from your bucket — cheer peers to keep momentum
          going.
          {showModerationControls
            ? " Hidden wins stay visible to you with moderation controls."
            : ""}
        </p>
      )}

      {!gamification.tableReady && (
        <p className="mt-4 rounded-xl border border-forge-gold/30 bg-forge-surface-raised px-3 py-2 text-xs text-forge-muted">
          Apply the Phase 8 gamification migration to enable the win feed.
        </p>
      )}

      {gamification.tableReady && !hasWins && (
        <p className="mt-4 text-sm text-forge-muted">
          {preview
            ? "Wins show up here when athletes in your bucket hit PRs or finish their plan. Join to share yours too."
            : "No wins yet this week. Hit a PR during a workout and it will show up here for your community."}
        </p>
      )}

      {hasWins && (
        <ul className={compact ? "mt-2.5 space-y-2" : "mt-4 space-y-3"}>
          {wins.map((win) => {
            const hidden = Boolean(win.hiddenAt);
            return (
            <li
              key={win.id}
              className={`rounded-xl border bg-forge-surface-raised ${
                compact ? "px-2.5 py-2" : "px-3 py-3"
              } ${
                hidden
                  ? "border-forge-coral/30 bg-forge-coral/5"
                  : "border-[var(--border)]"
              } ${
                win.isCurrentUser && !preview ? "ring-1 ring-forge-gold/25" : ""
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className={`font-semibold text-forge-text ${compact ? "text-xs" : "text-sm"}`}>
                      {win.displayLabel}
                      {win.isCurrentUser && !preview ? " (you)" : ""}
                    </p>
                    <span className="rounded-full border border-forge-gold/30 bg-forge-gold/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-forge-gold">
                      {winTypeLabel(win.winType)}
                    </span>
                    {hidden && showModerationControls && (
                      <span className="rounded-full border border-forge-coral/30 bg-forge-coral/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-forge-coral">
                        Hidden
                      </span>
                    )}
                  </div>
                  <p className={`text-forge-gold ${compact ? "mt-0.5 text-xs" : "mt-1 text-sm"}`}>
                    {win.headline}
                  </p>
                  {!compact && win.detail && (
                    <p className="mt-1 text-xs text-forge-muted">
                      {formatCommunityWinDetail(win.detail, unit)}
                    </p>
                  )}
                </div>
                {!compact && (
                  <p className="shrink-0 text-[11px] uppercase tracking-wide text-forge-muted">
                    {formatWhen(win.occurredAt)}
                  </p>
                )}
              </div>

              <div className={compact ? "mt-1.5" : "mt-3"}>
              <CommunityWinInteractions
                win={win}
                compact={compact}
                disabled={preview || !gamification.optedIn || win.isCurrentUser}
                disabledReason={
                  preview
                    ? "Join community to interact"
                    : win.isCurrentUser
                      ? "Others react to your wins"
                      : "Join community to interact"
                }
              />
              </div>

              {showModerationControls && (
                <CommunityWinModerationControls win={win} />
              )}
            </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
