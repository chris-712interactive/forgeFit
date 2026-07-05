import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdminUser } from "@/lib/admin/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdminUser();

  return <AdminShell adminEmail={admin.email}>{children}</AdminShell>;
}
