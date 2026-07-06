import { NextResponse } from "next/server";
import { getAdminApiActor } from "@/lib/admin/auth";
import {
  adminClearScoreFlag,
  adminHideCommunityWin,
  adminSuspendCommunityUser,
  adminUnhideCommunityWin,
  adminUnsuspendCommunityUser,
} from "@/lib/admin/community-moderation";

type ModerationAction =
  | "clear_score_flag"
  | "hide_win"
  | "unhide_win"
  | "suspend_user"
  | "unsuspend_user";

export async function POST(request: Request) {
  const actor = await getAdminApiActor();
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    action?: ModerationAction;
    scoreId?: string;
    winId?: string;
    userId?: string;
    reason?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { action } = body;
  if (!action) {
    return NextResponse.json({ error: "Missing action" }, { status: 400 });
  }

  try {
    switch (action) {
      case "clear_score_flag": {
        if (!body.scoreId) {
          return NextResponse.json({ error: "Missing scoreId" }, { status: 400 });
        }
        await adminClearScoreFlag({
          adminUserId: actor.userId,
          scoreId: body.scoreId,
        });
        break;
      }
      case "hide_win": {
        if (!body.winId) {
          return NextResponse.json({ error: "Missing winId" }, { status: 400 });
        }
        await adminHideCommunityWin({
          adminUserId: actor.userId,
          winId: body.winId,
          reason: body.reason,
        });
        break;
      }
      case "unhide_win": {
        if (!body.winId) {
          return NextResponse.json({ error: "Missing winId" }, { status: 400 });
        }
        await adminUnhideCommunityWin({
          adminUserId: actor.userId,
          winId: body.winId,
        });
        break;
      }
      case "suspend_user": {
        if (!body.userId) {
          return NextResponse.json({ error: "Missing userId" }, { status: 400 });
        }
        await adminSuspendCommunityUser({
          adminUserId: actor.userId,
          userId: body.userId,
          reason: body.reason,
        });
        break;
      }
      case "unsuspend_user": {
        if (!body.userId) {
          return NextResponse.json({ error: "Missing userId" }, { status: 400 });
        }
        await adminUnsuspendCommunityUser({
          adminUserId: actor.userId,
          userId: body.userId,
        });
        break;
      }
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Moderation action failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
