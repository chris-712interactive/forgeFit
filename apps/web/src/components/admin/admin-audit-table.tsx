import type { AdminAuditEntry } from "@/lib/admin/audit";

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatPayload(payload: Record<string, unknown>): string {
  const parts: string[] = [];
  if (typeof payload.tier === "string") parts.push(`tier ${payload.tier}`);
  if (typeof payload.expiresAt === "string") {
    parts.push(`until ${new Date(payload.expiresAt).toLocaleDateString()}`);
  }
  if (typeof payload.reason === "string") parts.push(payload.reason);
  if (typeof payload.targetEmail === "string" && parts.length === 0) {
    parts.push(payload.targetEmail);
  }
  return parts.join(" · ") || JSON.stringify(payload);
}

interface AdminAuditTableProps {
  entries: AdminAuditEntry[];
}

export function AdminAuditTable({ entries }: AdminAuditTableProps) {
  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-forge-surface-raised p-8 text-center text-sm text-forge-muted">
        No admin actions logged yet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-forge-surface-raised">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-forge-muted">
              <th className="px-4 py-3 font-semibold">When</th>
              <th className="px-4 py-3 font-semibold">Admin</th>
              <th className="px-4 py-3 font-semibold">Action</th>
              <th className="px-4 py-3 font-semibold">Target</th>
              <th className="px-4 py-3 font-semibold">Detail</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr
                key={entry.id}
                className="border-b border-white/5 align-top hover:bg-white/[0.02]"
              >
                <td className="px-4 py-3 text-forge-muted">
                  {formatWhen(entry.createdAt)}
                </td>
                <td className="px-4 py-3">{entry.adminEmail ?? entry.adminUserId.slice(0, 8)}</td>
                <td className="px-4 py-3 font-medium">{entry.action}</td>
                <td className="px-4 py-3 text-forge-muted">
                  {entry.targetEmail ?? entry.targetUserId?.slice(0, 8) ?? "—"}
                </td>
                <td className="px-4 py-3 text-forge-muted">
                  {formatPayload(entry.payload)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
