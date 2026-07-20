import { NextResponse } from "next/server";
import {
  createPartnerWithDeal,
  deletePartner,
  listPartnersForAdmin,
  updatePartnerStatus,
} from "@/lib/admin/partners";
import { getAdminApiActor } from "@/lib/admin/auth";
import {
  adminRateLimitResponse,
  checkAdminRateLimit,
} from "@/lib/admin/rate-limit";
import {
  grantPartnerPortalAccess,
  revokePartnerPortalAccess,
  updatePartnerTaxForm,
} from "@/lib/partners/portal";
import type { TaxFormStatus } from "@/lib/partners/commercial-policy";
import type {
  AttributionModel,
  CommissionBase,
  CommissionType,
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

interface Body {
  action?:
    | "create"
    | "delete"
    | "set_status"
    | "set_tax_form"
    | "portal_grant"
    | "portal_revoke";
  slug?: string;
  type?: PartnerType;
  displayName?: string;
  contactEmail?: string;
  code?: string;
  defaultLandingPath?: string;
  durationMonths?: number | null;
  lifetimeResidual?: boolean;
  percentBps?: number | null;
  cpaCents?: number | null;
  clickWindowDays?: number;
  commissionBase?: CommissionBase;
  commissionType?: CommissionType;
  attributionModel?: AttributionModel;
  eligibleTiers?: string[];
  payoutMinimumCents?: number;
  payoutNetDays?: number;
  dealNotes?: string;
  partnerId?: string;
  status?: PartnerStatus;
  taxFormStatus?: TaxFormStatus;
  email?: string;
  userId?: string;
}

export async function POST(request: Request) {
  const actor = await getAdminApiActor();
  if (!actor) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!checkAdminRateLimit(actor.userId)) {
    return adminRateLimitResponse();
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (body.action === "delete") {
    if (!body.partnerId) {
      return NextResponse.json(
        { error: "partnerId is required." },
        { status: 400 }
      );
    }
    const result = await deletePartner({
      adminUserId: actor.userId,
      partnerId: body.partnerId,
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
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

  if (body.action === "set_tax_form") {
    if (!body.partnerId || !body.taxFormStatus) {
      return NextResponse.json(
        { error: "partnerId and taxFormStatus are required." },
        { status: 400 }
      );
    }
    const result = await updatePartnerTaxForm({
      adminUserId: actor.userId,
      partnerId: body.partnerId,
      taxFormStatus: body.taxFormStatus,
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  }

  if (body.action === "portal_grant") {
    if (!body.partnerId || !body.email) {
      return NextResponse.json(
        { error: "partnerId and email are required." },
        { status: 400 }
      );
    }
    const result = await grantPartnerPortalAccess({
      adminUserId: actor.userId,
      partnerId: body.partnerId,
      email: body.email,
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true, userId: result.userId });
  }

  if (body.action === "portal_revoke") {
    if (!body.partnerId || !body.userId) {
      return NextResponse.json(
        { error: "partnerId and userId are required." },
        { status: 400 }
      );
    }
    const result = await revokePartnerPortalAccess({
      adminUserId: actor.userId,
      partnerId: body.partnerId,
      userId: body.userId,
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
    defaultLandingPath: body.defaultLandingPath,
    durationMonths,
    percentBps: body.percentBps,
    cpaCents: body.cpaCents,
    clickWindowDays: body.clickWindowDays,
    commissionBase: body.commissionBase,
    commissionType: body.commissionType,
    attributionModel: body.attributionModel,
    eligibleTiers: body.eligibleTiers,
    payoutMinimumCents: body.payoutMinimumCents,
    payoutNetDays: body.payoutNetDays,
    dealNotes: body.dealNotes,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, partnerId: result.partnerId });
}
