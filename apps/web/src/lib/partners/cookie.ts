import "server-only";

export {
  parsePartnerRefCookie,
  serializePartnerRefCookie,
  type PartnerRefCookie,
} from "./cookie-codec";

export const PARTNER_REF_COOKIE = "ff_ref";
export const PARTNER_VISITOR_COOKIE = "ff_vid";

export function partnerCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}
