import { createClient } from "@/lib/supabase/server";
import type { ProgressPhotoRow } from "./types";

const BUCKET = "progress-photos";
const SIGNED_URL_TTL_SEC = 60 * 60;

function mapRow(row: Record<string, unknown>): Omit<ProgressPhotoRow, "signedUrl"> {
  return {
    id: row.id as string,
    storagePath: row.storage_path as string,
    takenDate: row.taken_date as string,
    caption: (row.caption as string | null) ?? null,
    createdAt: row.created_at as string,
  };
}

export async function listProgressPhotos(
  userId: string
): Promise<{ photos: ProgressPhotoRow[]; tableReady: boolean }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("progress_photos")
    .select("id, storage_path, taken_date, caption, created_at")
    .eq("user_id", userId)
    .order("taken_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    const missing =
      error.message.includes("progress_photos") ||
      error.code === "PGRST205";
    return { photos: [], tableReady: !missing };
  }

  const photos = await Promise.all(
    (data ?? []).map(async (row) => {
      const mapped = mapRow(row);
      const { data: signed } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(mapped.storagePath, SIGNED_URL_TTL_SEC);

      return {
        ...mapped,
        signedUrl: signed?.signedUrl ?? null,
      };
    })
  );

  return { photos, tableReady: true };
}
