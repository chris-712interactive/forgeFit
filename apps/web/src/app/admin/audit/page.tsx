import { AdminAuditTable } from "@/components/admin/admin-audit-table";
import { listAdminAuditLog } from "@/lib/admin/audit";

export default async function AdminAuditPage() {
  const entries = await listAdminAuditLog(100);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-extrabold text-forge-text sm:text-3xl">
          Audit log
        </h1>
        <p className="mt-1 text-sm text-forge-muted">
          Immutable record of admin actions (comp grants, revokes, and more).
        </p>
      </header>

      <AdminAuditTable entries={entries} />
    </div>
  );
}
