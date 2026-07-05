"use client";

import { toggleFollowPeer } from "@/app/actions/community";
import { readActionError } from "@/lib/auth/action-result";
import type { FollowState } from "@/lib/coaching/types";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface CommunityFollowButtonProps {
  userId: string;
  initialState: FollowState;
  disabled?: boolean;
}

export function CommunityFollowButton({
  userId,
  initialState,
  disabled = false,
}: CommunityFollowButtonProps) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialState.following);
  const [isMutual, setIsMutual] = useState(initialState.isMutual);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle() {
    if (disabled || saving) return;

    setSaving(true);
    setError(null);
    const result = await toggleFollowPeer(userId);
    setSaving(false);

    if (!result.ok) {
      setError(readActionError(result) ?? "Could not update follow.");
      return;
    }

    setFollowing(result.following ?? false);
    setIsMutual(result.isMutual ?? false);
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => void handleToggle()}
        disabled={disabled || saving}
        className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
          following
            ? "border-forge-gold/40 bg-forge-gold/10 text-forge-gold"
            : "border-[var(--border)] bg-forge-surface text-forge-muted hover:text-forge-text"
        } ${disabled ? "cursor-not-allowed opacity-50" : ""} ${saving ? "opacity-60" : ""}`}
      >
        {saving ? "…" : isMutual ? "Friends" : following ? "Following" : "Follow"}
      </button>
      {error && (
        <p className="max-w-[10rem] text-right text-[10px] leading-snug text-forge-coral">
          {error}
        </p>
      )}
    </div>
  );
}
