"use client";

import { toggleCommunityWinCheer } from "@/app/actions/gamification";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface CommunityWinCheerButtonProps {
  winId: string;
  initialCheered: boolean;
  initialCount: number;
  disabled?: boolean;
  disabledReason?: string;
}

export function CommunityWinCheerButton({
  winId,
  initialCheered,
  initialCount,
  disabled = false,
  disabledReason,
}: CommunityWinCheerButtonProps) {
  const router = useRouter();
  const [cheered, setCheered] = useState(initialCheered);
  const [count, setCount] = useState(initialCount);
  const [saving, setSaving] = useState(false);

  async function handleToggle() {
    if (disabled || saving) return;

    setSaving(true);
    const result = await toggleCommunityWinCheer(winId);
    setSaving(false);

    if (!result.ok) {
      return;
    }

    setCheered(result.cheered ?? false);
    if (result.cheerCount != null) {
      setCount(result.cheerCount);
    }
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={() => void handleToggle()}
      disabled={disabled || saving}
      title={disabled ? disabledReason : cheered ? "Remove cheer" : "Cheer this win"}
      aria-pressed={cheered}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
        cheered
          ? "border-forge-gold/50 bg-forge-gold/15 text-forge-gold"
          : "border-[var(--border)] bg-forge-surface text-forge-muted hover:border-forge-gold/35 hover:text-forge-text"
      } ${disabled ? "cursor-not-allowed opacity-50" : ""} ${saving ? "opacity-60" : ""}`}
    >
      <span aria-hidden>{cheered ? "🔥" : "👏"}</span>
      <span>{count > 0 ? count : cheered ? "Cheered" : "Cheer"}</span>
    </button>
  );
}
