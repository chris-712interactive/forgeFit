import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminUserDetailPanel } from "@/components/admin/admin-user-detail-panel";
import { getAdminUserDiscountContext } from "@/lib/admin/discount";
import { getAdminUserDetail } from "@/lib/admin/users";

interface AdminUserDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminUserDetailPage({
  params,
}: AdminUserDetailPageProps) {
  const { id } = await params;
  const [user, discountContext] = await Promise.all([
    getAdminUserDetail(id),
    getAdminUserDiscountContext(id),
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

      <AdminUserDetailPanel user={user} discountContext={discountContext} />
    </div>
  );
}
