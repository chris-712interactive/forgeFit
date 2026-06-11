import { hasFeature } from "@/lib/billing/gates";
import { getSubscriptionForUser } from "@/lib/billing/subscription";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const BUCKET = "progress-photos";
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function GET() {
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

  const { data, error } = await supabase
    .from("progress_photos")
    .select("id, storage_path, taken_date, caption, created_at")
    .eq("user_id", user.id)
    .order("taken_date", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const photos = await Promise.all(
    (data ?? []).map(async (row) => {
      const { data: signed } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(row.storage_path as string, 3600);

      return {
        id: row.id,
        storagePath: row.storage_path,
        takenDate: row.taken_date,
        caption: row.caption,
        createdAt: row.created_at,
        signedUrl: signed?.signedUrl ?? null,
      };
    })
  );

  return NextResponse.json({ photos });
}

export async function POST(request: Request) {
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

  const form = await request.formData();
  const file = form.get("file");
  const takenDate = String(form.get("takenDate") ?? "").slice(0, 10);
  const caption = String(form.get("caption") ?? "").trim().slice(0, 200);

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Image file is required." }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Use JPEG, PNG, or WebP images." },
      { status: 400 }
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Image must be 5 MB or smaller." },
      { status: 400 }
    );
  }

  const ext =
    file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
        ? "webp"
        : "jpg";
  const photoId = crypto.randomUUID();
  const storagePath = `${user.id}/${photoId}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: row, error: insertError } = await supabase
    .from("progress_photos")
    .insert({
      id: photoId,
      user_id: user.id,
      storage_path: storagePath,
      taken_date: takenDate || new Date().toISOString().slice(0, 10),
      caption: caption || null,
    })
    .select("id, storage_path, taken_date, caption, created_at")
    .single();

  if (insertError) {
    await supabase.storage.from(BUCKET).remove([storagePath]);
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const { data: signed } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, 3600);

  return NextResponse.json({
    photo: {
      id: row.id,
      storagePath: row.storage_path,
      takenDate: row.taken_date,
      caption: row.caption,
      createdAt: row.created_at,
      signedUrl: signed?.signedUrl ?? null,
    },
  });
}
