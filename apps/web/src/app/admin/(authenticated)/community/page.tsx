import Link from "next/link";
import { CommunityOpsMetricsPanel } from "@/components/coaching/community-ops-metrics-panel";
import { getCommunityMetrics } from "@/lib/coaching/community-metrics";

export default async function AdminCommunityPage() {
  const metrics = await getCommunityMetrics();

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-forge-text sm:text-3xl">
            Community ops
          </h1>
          <p className="mt-1 text-sm text-forge-muted">
            WACP, opt-in rate, and action mix from live community metrics.
          </p>
        </div>
        <Link
          href="/community/moderation"
          className="inline-flex items-center rounded-xl border border-white/10 bg-forge-surface-raised px-4 py-2.5 text-sm font-semibold text-forge-text hover:bg-white/5"
        >
          Open moderation tools ↗
        </Link>
      </header>

      {metrics ? (
        <CommunityOpsMetricsPanel metrics={metrics} />
      ) : (
        <div className="rounded-2xl border border-forge-gold/25 bg-forge-gold/5 p-5 text-sm text-forge-muted">
          Community metrics unavailable. Ensure{" "}
          <code className="text-forge-text">SUPABASE_SERVICE_ROLE_KEY</code> is
          set and community metrics migrations are applied (
          <code className="text-forge-text">community_action_events</code>, etc.).
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-forge-surface-raised p-4 sm:p-5">
        <h2 className="font-display text-sm font-semibold text-forge-text">
          Moderation
        </h2>
        <p className="mt-2 text-sm text-forge-muted">
          Flagged scores, user reports, and deep moderation workflows live in the
          member-facing moderation console. Admins with moderator access can use
          the same tools at{" "}
          <Link
            href="/community/moderation"
            className="font-medium text-forge-steel hover:underline"
          >
            /community/moderation
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
