import { AdminPartnerLedgerPanel } from "@/components/admin/admin-partner-ledger-panel";
import { AdminPartnersPanel } from "@/components/admin/admin-partners-panel";
import {
  listCommissionLedger,
  summarizePartnerMonth,
} from "@/lib/admin/partner-ledger";
import { listPartnersForAdmin } from "@/lib/admin/partners";

function currentPeriodMonth(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

export default async function AdminPartnersPage() {
  const periodMonth = currentPeriodMonth();
  const [partners, ledger, summary] = await Promise.all([
    listPartnersForAdmin(),
    listCommissionLedger({ periodMonth }),
    summarizePartnerMonth(periodMonth),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-extrabold text-forge-text sm:text-3xl">
          Partners
        </h1>
        <p className="mt-1 text-sm text-forge-muted">
          Gyms, influencers, and affiliates — tracked links at{" "}
          <code className="text-forge-text">/r/&#123;slug&#125;</code>.           Commissions accrue on paid Stripe invoices. Partners view stats at{" "}
          <code className="text-forge-text">/partner</code>.
        </p>
      </header>

      <AdminPartnersPanel partners={partners} />
      <AdminPartnerLedgerPanel
        partners={partners}
        initialPeriodMonth={periodMonth}
        initialLedger={ledger}
        initialSummary={summary}
      />
    </div>
  );
}
