import { AdminCommunityModerationPanel } from "@/components/admin/admin-community-moderation-panel";
import { CommunityOpsMetricsPanel } from "@/components/coaching/community-ops-metrics-panel";
import { getAdminCommunityModerationData } from "@/lib/admin/community-moderation";

export default async function AdminCommunityPage() {
  const data = await getAdminCommunityModerationData();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-extrabold text-forge-text sm:text-3xl">
          Community ops
        </h1>
        <p className="mt-1 text-sm text-forge-muted">
          WACP metrics, flagged scores, and win moderation — all buckets, admin-only.
        </p>
      </header>

      {data.communityMetrics ? (
        <CommunityOpsMetricsPanel metrics={data.communityMetrics} />
      ) : (
        <div className="rounded-2xl border border-forge-gold/25 bg-forge-gold/5 p-5 text-sm text-forge-muted">
          Community metrics unavailable. Ensure{" "}
          <code className="text-forge-text">SUPABASE_SERVICE_ROLE_KEY</code> is
          set and community metrics migrations are applied (
          <code className="text-forge-text">community_action_events</code>, etc.).
        </div>
      )}

      <AdminCommunityModerationPanel data={data} />
    </div>
  );
}
