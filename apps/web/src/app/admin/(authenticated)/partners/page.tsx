import { AdminPartnersPanel } from "@/components/admin/admin-partners-panel";
import { listPartnersForAdmin } from "@/lib/admin/partners";

export default async function AdminPartnersPage() {
  const partners = await listPartnersForAdmin();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-extrabold text-forge-text sm:text-3xl">
          Partners
        </h1>
        <p className="mt-1 text-sm text-forge-muted">
          Gyms, influencers, and affiliates — tracked links at{" "}
          <code className="text-forge-text">/r/&#123;slug&#125;</code>. Commission
          payouts ship in Phase 14B.
        </p>
      </header>

      <AdminPartnersPanel partners={partners} />
    </div>
  );
}
