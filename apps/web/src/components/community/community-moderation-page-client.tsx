"use client";

import { CommunityModerationPanel } from "@/components/coaching/community-moderation-panel";
import { CommunityOpsMetricsPanel } from "@/components/coaching/community-ops-metrics-panel";
import { CommunityWinsFeed } from "@/components/coaching/community-wins-feed";
import type { CommunityModerationPageData } from "@/lib/coaching/types";
import Link from "next/link";

interface CommunityModerationPageClientProps {
  data: CommunityModerationPageData;
}

export function CommunityModerationPageClient({
  data,
}: CommunityModerationPageClientProps) {
  const { gamification, moderationQueue, communityMetrics } = data;

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 pb-8 sm:max-w-2xl sm:gap-5">
      <header className="px-0.5">
        <Link
          href="/community"
          className="text-xs font-medium text-forge-ember underline-offset-2 hover:underline"
        >
          ← Community
        </Link>
        <h1 className="font-display mt-2 text-xl font-bold text-forge-text sm:text-2xl">
          Moderator tools
        </h1>
        <p className="mt-0.5 text-xs text-forge-muted sm:text-sm">
          Review flagged scores, hidden wins, and community health metrics.
        </p>
      </header>

      {communityMetrics && (
        <CommunityOpsMetricsPanel metrics={communityMetrics} />
      )}

      {moderationQueue && <CommunityModerationPanel queue={moderationQueue} />}

      <CommunityWinsFeed
        gamification={gamification}
        showModerationControls
      />
    </div>
  );
}
