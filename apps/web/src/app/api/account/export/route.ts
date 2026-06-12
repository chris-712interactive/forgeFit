import { buildAccountExport } from "@/lib/account/export";
import { buildAccountExportCsv } from "@/lib/account/export-csv";
import { getSubscriptionForUser } from "@/lib/billing/subscription";
import { hasFeature } from "@/lib/billing/gates";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subscription = await getSubscriptionForUser(user.id);
  if (!hasFeature(subscription, "data_export")) {
    return NextResponse.json(
      { error: "Data export requires a Pro or Pro+ subscription." },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format");

  const exportData = await buildAccountExport(
    supabase,
    user.id,
    user.email ?? null
  );
  const dateStamp = exportData.exportedAt.slice(0, 10);

  if (format === "csv") {
    const filename = `forgerep-export-${dateStamp}.csv`;
    return new NextResponse(buildAccountExportCsv(exportData), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  }

  const filename = `forgerep-export-${dateStamp}.json`;

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
