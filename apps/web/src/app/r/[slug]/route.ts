import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  PARTNER_REF_COOKIE,
  PARTNER_VISITOR_COOKIE,
  partnerCookieOptions,
  serializePartnerRefCookie,
  type PartnerRefCookie,
} from "@/lib/partners/cookie";
import { recordAttributionClick } from "@/lib/partners/stamp";
import {
  getActiveDealForPartner,
  getActivePartnerBySlug,
  getActivePartnerCode,
  safeLandingPath,
} from "@/lib/partners/resolve";
import { getSiteUrl } from "@/lib/seo/site-url";

function appendQuery(
  path: string,
  params: Record<string, string | undefined>
): string {
  const url = new URL(path, "http://local.invalid");
  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value);
  }
  return `${url.pathname}${url.search}`;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const requestUrl = new URL(request.url);
  const codeParam = requestUrl.searchParams.get("code");
  const club = requestUrl.searchParams.get("club") ?? undefined;
  const campaign = requestUrl.searchParams.get("campaign") ?? undefined;
  const utmSource = requestUrl.searchParams.get("utm_source");
  const utmMedium = requestUrl.searchParams.get("utm_medium");
  const utmCampaign = requestUrl.searchParams.get("utm_campaign");

  let partner = await getActivePartnerBySlug(slug);
  let partnerCodeId: string | null = null;
  let codeForCookie: string | undefined;

  if (!partner && codeParam) {
    const coded = await getActivePartnerCode(codeParam);
    if (coded) {
      partner = coded.partner;
      partnerCodeId = coded.id;
      codeForCookie = coded.code;
    }
  } else if (partner && codeParam) {
    const coded = await getActivePartnerCode(codeParam);
    if (coded && coded.partnerId === partner.id) {
      partnerCodeId = coded.id;
      codeForCookie = coded.code;
    }
  }

  const siteUrl = getSiteUrl();
  if (!partner) {
    return NextResponse.redirect(`${siteUrl}/signup`);
  }

  const deal = await getActiveDealForPartner(partner.id);
  const clickWindowDays = deal?.clickWindowDays ?? 30;
  const maxAge = clickWindowDays * 24 * 60 * 60;

  const cookieStore = await cookies();
  let visitorId = cookieStore.get(PARTNER_VISITOR_COOKIE)?.value;
  if (!visitorId) {
    visitorId = randomUUID();
  }

  const ref: PartnerRefCookie = {
    slug: partner.slug,
    code: codeForCookie,
    club,
    campaign,
    visitorId,
    clickedAt: new Date().toISOString(),
  };

  await recordAttributionClick({
    partnerId: partner.id,
    partnerCodeId,
    visitorId,
    source: club || campaign ? "deep_link" : codeForCookie ? "code" : "link",
    landingUrl: requestUrl.toString(),
    referrer: request.headers.get("referer"),
    utmSource,
    utmMedium,
    utmCampaign,
    metadata: { club: club ?? null, campaign: campaign ?? null },
  });

  const landing = appendQuery(safeLandingPath(partner.defaultLandingPath), {
    utm_source: utmSource ?? undefined,
    utm_medium: utmMedium ?? undefined,
    utm_campaign: utmCampaign ?? undefined,
  });

  const response = NextResponse.redirect(`${siteUrl}${landing}`);
  response.cookies.set(
    PARTNER_REF_COOKIE,
    serializePartnerRefCookie(ref),
    partnerCookieOptions(maxAge)
  );
  response.cookies.set(
    PARTNER_VISITOR_COOKIE,
    visitorId,
    partnerCookieOptions(maxAge)
  );

  return response;
}
