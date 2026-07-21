import { AdminBillingActionsForm } from "@/components/admin/admin-billing-actions-form";
import { AdminCompUpgradeForm } from "@/components/admin/admin-comp-upgrade-form";
import { AdminDiscountForm } from "@/components/admin/admin-discount-form";
import { AdminFeatureFlagsForm } from "@/components/admin/admin-feature-flags-form";
import { AdminImpersonateButton } from "@/components/admin/admin-impersonate-button";
import type { AdminBillingContext } from "@/lib/admin/billing-actions";
import type { AdminUserDiscountContext } from "@/lib/admin/discount";
import type { AdminUserDetail } from "@/lib/admin/users";

function DetailItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-forge-muted">{label}</p>
      <div className="mt-1 text-sm text-forge-text">{children}</div>
    </div>
  );
}

interface AdminUserDetailPanelProps {
  user: AdminUserDetail;
  discountContext: AdminUserDiscountContext;
  billingContext: AdminBillingContext;
  featureFlags: Record<string, boolean>;
}

export function AdminUserDetailPanel({
  user,
  discountContext,
  billingContext,
  featureFlags,
}: AdminUserDetailPanelProps) {
  const stripeCustomerUrl = user.stripeCustomerId
    ? `https://dashboard.stripe.com/customers/${user.stripeCustomerId}`
    : null;

  return (
    <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
      <section className="min-w-0 rounded-2xl border border-white/10 bg-forge-surface-raised p-4 sm:p-5">
        <h2 className="font-display text-lg font-bold text-forge-text">
          {user.email ?? "No email on file"}
        </h2>
        <p className="mt-1 break-words text-sm text-forge-muted">
          {user.displayName ?? "No display name"} ·{" "}
          <span className="break-all font-mono text-xs">{user.id}</span>
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <DetailItem label="Tier">
            {user.tier}
            {user.billingSource === "comp" ? " (comp)" : ""}
          </DetailItem>
          <DetailItem label="Status">{user.status}</DetailItem>
          <DetailItem label="Joined">
            {new Date(user.createdAt).toLocaleDateString()}
          </DetailItem>
          <DetailItem label="Signup source">
            {user.signupSource ?? "—"}
          </DetailItem>
          <DetailItem label="Onboarding">
            {user.onboardingComplete ? "Complete" : "Incomplete"}
          </DetailItem>
          <DetailItem label="Workouts logged">{user.workoutCount}</DetailItem>
          <DetailItem label="Community">
            {user.gamificationOptIn ? "Opted in" : "Not opted in"}
          </DetailItem>
          <DetailItem label="Period end">
            {user.subscriptionCurrentPeriodEnd
              ? new Date(user.subscriptionCurrentPeriodEnd).toLocaleDateString()
              : "—"}
          </DetailItem>
        </div>

        {user.compReason ? (
          <div className="mt-4 rounded-xl border border-forge-steel/20 bg-forge-steel/5 p-3 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-forge-steel">
              Comp note
            </p>
            <p className="mt-1 text-forge-text">{user.compReason}</p>
            {user.compExpiresAt ? (
              <p className="mt-1 text-xs text-forge-muted">
                Expires {new Date(user.compExpiresAt).toLocaleDateString()}
              </p>
            ) : null}
          </div>
        ) : null}

        {stripeCustomerUrl ? (
          <p className="mt-4 text-sm">
            <a
              href={stripeCustomerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-forge-steel hover:underline"
            >
              Open in Stripe Dashboard ↗
            </a>
          </p>
        ) : null}
      </section>

      <div className="min-w-0 space-y-4">
        <AdminImpersonateButton userId={user.id} email={user.email} />
        <AdminFeatureFlagsForm userId={user.id} initialFlags={featureFlags} />
        <AdminBillingActionsForm userId={user.id} context={billingContext} />
        <AdminDiscountForm userId={user.id} context={discountContext} />
        <AdminCompUpgradeForm user={user} />
      </div>
    </div>
  );
}
