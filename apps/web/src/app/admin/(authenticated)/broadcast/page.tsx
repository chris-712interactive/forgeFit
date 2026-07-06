import { AdminBroadcastForm } from "@/components/admin/admin-broadcast-form";

export default function AdminBroadcastPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-extrabold text-forge-text sm:text-3xl">
          Broadcast
        </h1>
        <p className="mt-1 text-sm text-forge-muted">
          Send operational email (Resend) or web push to a user segment. Max 500
          recipients per send; all sends are audit-logged.
        </p>
      </header>

      <AdminBroadcastForm />
    </div>
  );
}
