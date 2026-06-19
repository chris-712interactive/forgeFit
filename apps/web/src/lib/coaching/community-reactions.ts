import type { CommunityWinRow } from "./types";

export type WinReactionKey = "fire" | "strong" | "clap" | "trophy" | "motivated";
export type WinPresetCommentKey =
  | "lets_go"
  | "crushing_it"
  | "inspired"
  | "same_goal"
  | "well_done";

export const WIN_REACTIONS: { key: WinReactionKey; emoji: string; label: string }[] = [
  { key: "fire", emoji: "🔥", label: "Fire" },
  { key: "strong", emoji: "💪", label: "Strong" },
  { key: "clap", emoji: "👏", label: "Clap" },
  { key: "trophy", emoji: "🏆", label: "Trophy" },
  { key: "motivated", emoji: "⚡", label: "Motivated" },
];

export const WIN_PRESET_COMMENTS: {
  key: WinPresetCommentKey;
  label: string;
}[] = [
  { key: "lets_go", label: "Let's go!" },
  { key: "crushing_it", label: "Crushing it" },
  { key: "inspired", label: "Inspired me" },
  { key: "same_goal", label: "Same goal here" },
  { key: "well_done", label: "Well done" },
];

export function presetCommentLabel(key: WinPresetCommentKey): string {
  return WIN_PRESET_COMMENTS.find((item) => item.key === key)?.label ?? key;
}

export interface WinInteractionAggregate {
  reactionCounts: Partial<Record<WinReactionKey, number>>;
  myReaction: WinReactionKey | null;
  commentCounts: Partial<Record<WinPresetCommentKey, number>>;
  myComment: WinPresetCommentKey | null;
}

export function emptyWinInteractions(): WinInteractionAggregate {
  return {
    reactionCounts: {},
    myReaction: null,
    commentCounts: {},
    myComment: null,
  };
}

export function aggregateWinInteractions(
  winIds: string[],
  reactions: { win_id: string; user_id: string; reaction_key: string }[],
  comments: { win_id: string; user_id: string; comment_key: string }[],
  viewerUserId: string
): Map<string, WinInteractionAggregate> {
  const byWinId = new Map<string, WinInteractionAggregate>();

  for (const winId of winIds) {
    byWinId.set(winId, emptyWinInteractions());
  }

  for (const row of reactions) {
    const winId = row.win_id;
    const aggregate = byWinId.get(winId);
    if (!aggregate) continue;

    const key = row.reaction_key as WinReactionKey;
    aggregate.reactionCounts[key] = (aggregate.reactionCounts[key] ?? 0) + 1;
    if (row.user_id === viewerUserId) {
      aggregate.myReaction = key;
    }
  }

  for (const row of comments) {
    const winId = row.win_id;
    const aggregate = byWinId.get(winId);
    if (!aggregate) continue;

    const key = row.comment_key as WinPresetCommentKey;
    aggregate.commentCounts[key] = (aggregate.commentCounts[key] ?? 0) + 1;
    if (row.user_id === viewerUserId) {
      aggregate.myComment = key;
    }
  }

  return byWinId;
}

export function applyWinInteractions(
  wins: CommunityWinRow[],
  aggregates: Map<string, WinInteractionAggregate>
): CommunityWinRow[] {
  return wins.map((win) => {
    const aggregate = aggregates.get(win.id) ?? emptyWinInteractions();
    return {
      ...win,
      reactionCounts: aggregate.reactionCounts,
      myReaction: aggregate.myReaction,
      commentCounts: aggregate.commentCounts,
      myComment: aggregate.myComment,
    };
  });
}
