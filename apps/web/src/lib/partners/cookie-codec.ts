export interface PartnerRefCookie {
  slug: string;
  code?: string;
  club?: string;
  campaign?: string;
  visitorId: string;
  clickedAt: string;
}

function encodePayload(payload: PartnerRefCookie): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodePayload(raw: string): PartnerRefCookie | null {
  try {
    const json = Buffer.from(raw, "base64url").toString("utf8");
    const parsed = JSON.parse(json) as PartnerRefCookie;
    if (
      typeof parsed?.slug !== "string" ||
      typeof parsed?.visitorId !== "string" ||
      typeof parsed?.clickedAt !== "string"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function serializePartnerRefCookie(payload: PartnerRefCookie): string {
  return encodePayload(payload);
}

export function parsePartnerRefCookie(
  raw: string | undefined
): PartnerRefCookie | null {
  if (!raw) return null;
  return decodePayload(raw);
}
