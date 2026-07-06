import { AdminOverviewCards } from "@/components/admin/admin-overview-cards";
import { getAdminOverviewMetrics } from "@/lib/admin/metrics";

export default async function AdminOverviewPage() {
  const metrics = await getAdminOverviewMetrics();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-extrabold text-forge-text sm:text-3xl">
          Overview
        </h1>
        <p className="mt-1 text-sm text-forge-muted">
          Revenue and subscription health from Stripe (cached 15 min).
        </p>
      </header>

      <AdminOverviewCards metrics={metrics} />
    </div>
  );
}
