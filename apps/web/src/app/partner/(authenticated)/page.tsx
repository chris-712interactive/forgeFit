import { PartnerPortalDashboard } from "@/components/partner/partner-portal-dashboard";
import {
  getPartnerPortalStats,
  requirePartnerPortalUser,
} from "@/lib/partners/portal";
import { getSiteUrl } from "@/lib/seo/site-url";

export default async function PartnerDashboardPage() {
  const ctx = await requirePartnerPortalUser();
  const stats = await getPartnerPortalStats(
    ctx.partnerId,
    ctx.partnerSlug,
    ctx.partnerType
  );
  const fullLink = `${getSiteUrl()}${stats.trackedLinkPath}`;

  return (
    <PartnerPortalDashboard
      partnerName={ctx.partnerName}
      partnerType={ctx.partnerType}
      fullLink={fullLink}
      stats={stats}
    />
  );
}
