import { AdminOperatorsPanel } from "@/components/admin/admin-operators-panel";
import { listAdminOperators } from "@/lib/admin/admins";

export default async function AdminOperatorsPage() {
  const admins = await listAdminOperators();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-extrabold text-forge-text sm:text-3xl">
          Admins
        </h1>
        <p className="mt-1 text-sm text-forge-muted">
          Grant or revoke <code className="text-forge-text">profiles.is_admin</code>.
          Env <code className="text-forge-text">ADMIN_USER_IDS</code> still grants
          access without DB flag.
        </p>
      </header>

      <AdminOperatorsPanel admins={admins} />
    </div>
  );
}
