import { createAdminClient } from "@/lib/supabase/admin";

export interface RevenueSnapshotPoint {
  snapshotDate: string;
  mrrUsd: number;
  arrUsd: number;
  paidSubscribers: number;
  compCount: number;
}

export async function recordDailyRevenueSnapshot(input: {
  mrrUsd: number;
  arrUsd: number;
  paidSubscribers: number;
  compCount: number;
}): Promise<void> {
  const admin = createAdminClient();
  const snapshotDate = new Date().toISOString().slice(0, 10);

  const { error } = await admin.from("admin_revenue_snapshots").upsert(
    {
      snapshot_date: snapshotDate,
      mrr_usd: input.mrrUsd,
      arr_usd: input.arrUsd,
      paid_subscribers: input.paidSubscribers,
      comp_count: input.compCount,
    },
    { onConflict: "snapshot_date" }
  );

  if (error) {
    console.error("admin revenue snapshot upsert failed:", error.message);
  }
}

export async function getRevenueSnapshotHistory(
  days = 90
): Promise<RevenueSnapshotPoint[]> {
  const admin = createAdminClient();
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - days);
  const cutoffDate = cutoff.toISOString().slice(0, 10);

  const { data, error } = await admin
    .from("admin_revenue_snapshots")
    .select(
      "snapshot_date, mrr_usd, arr_usd, paid_subscribers, comp_count"
    )
    .gte("snapshot_date", cutoffDate)
    .order("snapshot_date", { ascending: true });

  if (error) {
    console.error("admin revenue snapshot history failed:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    snapshotDate: row.snapshot_date as string,
    mrrUsd: Number(row.mrr_usd),
    arrUsd: Number(row.arr_usd),
    paidSubscribers: row.paid_subscribers as number,
    compCount: row.comp_count as number,
  }));
}
