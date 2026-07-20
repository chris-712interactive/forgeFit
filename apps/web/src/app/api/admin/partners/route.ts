import { NextResponse } from "next/server";
import {
  createPartnerWithDeal,
  listPartnersForAdmin,
  updatePartnerStatus,
} from "@/lib/admin/partners";
import { getAdminApiActor } from "@/lib/admin/auth";
import {
  adminRateLimitResponse,
  checkAdminRateLimit,
} from "@/lib/admin/rate-limit";
import type {
  CommissionBase,
  PartnerStatus,
  PartnerType,
} from "@/lib/partners/types";

export async function GET() {
  const actor = await getAdminApiActor();
  if (!actor) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const partners = await listPartnersForAdmin();
  return NextResponse.json({ partners });
}

interface CreateBody {
  action?: "create" | "set_status";
  slug?: string;
  type?: PartnerType;
  displayName?: string;
  contactEmail?: string;
  code?: string;
  durationMonths?: number | null;
  lifetimeResidual?: boolean;
  percentBps?: number;
  clickWindowDays?: number;
  commissionBase?: CommissionBase;
  partnerId?: string;
  status?: PartnerStatus;
}

export async function POST(request: Request) {
  const actor = await getAdminApiActor();
  if (!actor) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!checkAdminRateLimit(actor.userId)) {
    return adminRateLimitResponse();
  }

  let body: CreateBody;
  try {
    body = (await request.json()) as CreateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (body.action === "set_status") {
    if (!body.partnerId || !body.status) {
      return NextResponse.json(
        { error: "partnerId and status are required." },
        { status: 400 }
      );
    }
    const result = await updatePartnerStatus({
      adminUserId: actor.userId,
      partnerId: body.partnerId,
      status: body.status,
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  }

  if (body.action !== "create") {
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }

  if (!body.slug || !body.type || !body.displayName) {
    return NextResponse.json(
      { error: "slug, type, and displayName are required." },
      { status: 400 }
    );
  }

  const durationMonths = body.lifetimeResidual
    ? null
    : body.durationMonths === undefined
      ? undefined
      : body.durationMonths;

  const result = await createPartnerWithDeal({
    adminUserId: actor.userId,
    slug: body.slug,
    type: body.type,
    displayName: body.displayName,
    contactEmail: body.contactEmail,
    code: body.code,
    durationMonths,
    percentBps: body.percentBps,
    clickWindowDays: body.clickWindowDays,
    commissionBase: body.commissionBase,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, partnerId: result.partnerId });
}
