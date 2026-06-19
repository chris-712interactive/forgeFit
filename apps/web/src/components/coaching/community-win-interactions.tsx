"use client";

import {
  setCommunityWinPresetComment,
  toggleCommunityWinReaction,
} from "@/app/actions/gamification";
import { CommunityWinCheerButton } from "@/components/coaching/community-win-cheer-button";
import {
  WIN_PRESET_COMMENTS,
  WIN_REACTIONS,
  presetCommentLabel,
} from "@/lib/coaching/community-reactions";
import type { CommunityWinRow } from "@/lib/coaching/types";
import type {
  WinPresetCommentKey,
  WinReactionKey,
} from "@/lib/coaching/community-reactions";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface CommunityWinInteractionsProps {
  win: CommunityWinRow;
  disabled?: boolean;
  disabledReason?: string;
  compact?: boolean;
}

export function CommunityWinInteractions({
  win,
  disabled = false,
  disabledReason,
  compact = false,
}: CommunityWinInteractionsProps) {
  const router = useRouter();
  const [myReaction, setMyReaction] = useState<WinReactionKey | null>(
    win.myReaction ?? null
  );
  const [myComment, setMyComment] = useState<WinPresetCommentKey | null>(
    win.myComment ?? null
  );
  const [reactionCounts, setReactionCounts] = useState(
    win.reactionCounts ?? {}
  );
  const [commentCounts, setCommentCounts] = useState(win.commentCounts ?? {});
  const [savingReaction, setSavingReaction] = useState<string | null>(null);
  const [savingComment, setSavingComment] = useState(false);
  const [showComments, setShowComments] = useState(false);

  async function handleReaction(reactionKey: WinReactionKey) {
    if (disabled || savingReaction) return;

    setSavingReaction(reactionKey);
    const result = await toggleCommunityWinReaction(win.id, reactionKey);
    setSavingReaction(null);

    if (!result.ok) return;

    setReactionCounts((current) => {
      const next = { ...current };
      if (myReaction && myReaction !== reactionKey) {
        next[myReaction] = Math.max(0, (next[myReaction] ?? 1) - 1);
        if (next[myReaction] === 0) delete next[myReaction];
      }

      if (result.active) {
        next[reactionKey] = (next[reactionKey] ?? 0) + 1;
        setMyReaction(reactionKey);
      } else {
        next[reactionKey] = Math.max(0, (next[reactionKey] ?? 1) - 1);
        if (next[reactionKey] === 0) delete next[reactionKey];
        setMyReaction(null);
      }

      return next;
    });

    router.refresh();
  }

  async function handleComment(commentKey: WinPresetCommentKey) {
    if (disabled || savingComment) return;

    const nextComment = myComment === commentKey ? null : commentKey;
    setSavingComment(true);
    const result = await setCommunityWinPresetComment(win.id, nextComment);
    setSavingComment(false);

    if (!result.ok) return;

    setCommentCounts((current) => {
      const next = { ...current };
      if (myComment) {
        next[myComment] = Math.max(0, (next[myComment] ?? 1) - 1);
        if (next[myComment] === 0) delete next[myComment];
      }
      if (nextComment) {
        next[nextComment] = (next[nextComment] ?? 0) + 1;
      }
      return next;
    });
    setMyComment(nextComment);
    router.refresh();
  }

  const totalReactions = Object.values(reactionCounts).reduce(
    (sum, count) => sum + (count ?? 0),
    0
  );
  const visibleComments = Object.entries(commentCounts).filter(
    ([, count]) => (count ?? 0) > 0
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <CommunityWinCheerButton
          winId={win.id}
          initialCheered={win.cheeredByMe}
          initialCount={win.cheerCount}
          disabled={disabled || win.isCurrentUser}
          disabledReason={
            disabled
              ? disabledReason
              : win.isCurrentUser
                ? "Others cheer your wins"
                : undefined
          }
        />

        {!compact &&
          WIN_REACTIONS.map((reaction) => {
            const active = myReaction === reaction.key;
            const count = reactionCounts[reaction.key] ?? 0;
            return (
              <button
                key={reaction.key}
                type="button"
                disabled={disabled || win.isCurrentUser || savingReaction != null}
                title={reaction.label}
                aria-pressed={active}
                onClick={() => void handleReaction(reaction.key)}
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-medium transition-colors ${
                  active
                    ? "border-forge-gold/50 bg-forge-gold/15 text-forge-gold"
                    : "border-[var(--border)] bg-forge-surface text-forge-muted hover:border-forge-gold/35 hover:text-forge-text"
                } ${disabled || win.isCurrentUser ? "cursor-not-allowed opacity-50" : ""}`}
              >
                <span aria-hidden>{reaction.emoji}</span>
                {count > 0 ? <span>{count}</span> : null}
              </button>
            );
          })}

        {!compact && !disabled && !win.isCurrentUser && (
          <button
            type="button"
            onClick={() => setShowComments((value) => !value)}
            className="text-[11px] font-medium text-forge-ember underline-offset-2 hover:underline"
          >
            {showComments ? "Hide replies" : "Quick reply"}
          </button>
        )}
      </div>

      {!compact && totalReactions > 0 && (
        <p className="text-[11px] text-forge-muted">
          {totalReactions === 1
            ? "1 reaction"
            : `${totalReactions} reactions`}
        </p>
      )}

      {!compact && visibleComments.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {visibleComments.map(([key, count]) => (
            <span
              key={key}
              className="rounded-full border border-[var(--border)] bg-forge-surface px-2 py-0.5 text-[10px] text-forge-muted"
            >
              {presetCommentLabel(key as WinPresetCommentKey)}
              {(count ?? 0) > 1 ? ` · ${count}` : ""}
            </span>
          ))}
        </div>
      )}

      {!compact && showComments && !disabled && !win.isCurrentUser && (
        <div className="flex flex-wrap gap-1.5">
          {WIN_PRESET_COMMENTS.map((comment) => {
            const active = myComment === comment.key;
            return (
              <button
                key={comment.key}
                type="button"
                disabled={savingComment}
                aria-pressed={active}
                onClick={() => void handleComment(comment.key)}
                className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  active
                    ? "border-forge-ember/40 bg-forge-ember/10 text-forge-ember"
                    : "border-[var(--border)] bg-forge-surface-raised text-forge-muted hover:text-forge-text"
                }`}
              >
                {comment.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
