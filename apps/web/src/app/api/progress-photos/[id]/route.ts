import { hasFeature } from "@/lib/billing/gates";
import { getSubscriptionForUser } from "@/lib/billing/subscription";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const BUCKET = "progress-photos";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subscription = await getSubscriptionForUser(user.id);
  if (!hasFeature(subscription, "progress_photos")) {
    return NextResponse.json(
      { error: "Progress photos require a Pro or Pro+ subscription." },
      { status: 403 }
    );
  }

  const { data: row, error: fetchError } = await supabase
    .from("progress_photos")
    .select("storage_path")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !row) {
    return NextResponse.json({ error: "Photo not found." }, { status: 404 });
  }

  await supabase.storage.from(BUCKET).remove([row.storage_path as string]);

  const { error: deleteError } = await supabase
    .from("progress_photos")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
