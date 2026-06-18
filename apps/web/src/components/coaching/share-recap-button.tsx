"use client";

import type { WeeklyCommunityRecap } from "@/lib/coaching/types";
import { useState } from "react";

interface ShareRecapButtonProps {
  recap: WeeklyCommunityRecap;
}

function buildShareText(recap: WeeklyCommunityRecap): string {
  const parts = [
    `I finished #${recap.lastWeekRank} in my ForgeFit bucket last week`,
  ];
  if (recap.lastWeekScore != null) {
    parts.push(`with ${recap.lastWeekScore} habit points`);
  }
  if (recap.bucketLabel) {
    parts.push(`(${recap.bucketLabel})`);
  }
  if (recap.crewName) {
    parts.push(`— crew: ${recap.crewName}`);
  }
  parts.push("New week, new climb. 💪");
  return parts.join(" ");
}

export function ShareRecapButton({ recap }: ShareRecapButtonProps) {
  const [shared, setShared] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleShare() {
    setError(null);
    const text = buildShareText(recap);

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "My ForgeFit weekly recap",
          text,
          url: window.location.origin,
        });
        setShared(true);
        return;
      } catch (shareError) {
        if (shareError instanceof Error && shareError.name === "AbortError") {
          return;
        }
      }
    }

    try {
      await navigator.clipboard.writeText(text);
      setShared(true);
    } catch {
      setError("Could not share or copy recap.");
    }
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => void handleShare()}
        className="text-xs font-medium text-forge-ember underline-offset-2 hover:underline"
      >
        {shared ? "Shared!" : "Share recap"}
      </button>
      {error && <p className="mt-1 text-xs text-forge-coral">{error}</p>}
    </div>
  );
}
