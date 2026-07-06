import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminUserDetailPanel } from "@/components/admin/admin-user-detail-panel";
import { getAdminBillingContext } from "@/lib/admin/billing-actions";
import { getAdminUserDiscountContext } from "@/lib/admin/discount";
import { getUserAdminFeatureFlags } from "@/lib/admin/feature-flags";
import { getAdminUserDetail } from "@/lib/admin/users";

interface AdminUserDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminUserDetailPage({
  params,
}: AdminUserDetailPageProps) {
  const { id } = await params;
  const [user, discountContext, billingContext, featureFlags] = await Promise.all([
    getAdminUserDetail(id),
    getAdminUserDiscountContext(id),
    getAdminBillingContext(id),
    getUserAdminFeatureFlags(id),
  ]);

  if (!user) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <header>
        <Link
          href="/admin/users"
          className="text-xs font-medium text-forge-ember hover:underline"
        >
          ← All users
        </Link>
        <h1 className="font-display mt-2 text-2xl font-extrabold text-forge-text sm:text-3xl">
          User detail
        </h1>
      </header>

      <AdminUserDetailPanel
        user={user}
        discountContext={discountContext}
        billingContext={billingContext}
        featureFlags={featureFlags}
      />
    </div>
  );
}
