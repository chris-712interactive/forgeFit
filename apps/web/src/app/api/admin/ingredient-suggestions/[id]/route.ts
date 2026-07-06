import { NextResponse } from "next/server";
import {
  updateIngredientSuggestionStatus,
  type IngredientSuggestionStatus,
} from "@/lib/admin/ingredient-suggestions";
import { getAdminApiActor } from "@/lib/admin/auth";
import {
  adminRateLimitResponse,
  checkAdminRateLimit,
} from "@/lib/admin/rate-limit";

interface UpdateBody {
  status?: IngredientSuggestionStatus;
  reason?: string;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const actor = await getAdminApiActor();
  if (!actor) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!checkAdminRateLimit(actor.userId)) {
    return adminRateLimitResponse();
  }

  const { id } = await context.params;
  let body: UpdateBody;

  try {
    body = (await request.json()) as UpdateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const status = body.status;
  if (
    status !== "pending" &&
    status !== "reviewed" &&
    status !== "added" &&
    status !== "rejected"
  ) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const result = await updateIngredientSuggestionStatus({
    adminUserId: actor.userId,
    suggestionId: id,
    status,
    reason: body.reason ?? "",
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
