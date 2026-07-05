import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

export const IMPERSONATION_COOKIE = "forge_impersonate";
const MAX_AGE_SEC = 4 * 60 * 60;

function impersonationSecret(): string {
  return (
    process.env.ADMIN_IMPERSONATION_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim() ||
    ""
  );
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function hmacSign(payload: string): Promise<string> {
  const secret = impersonationSecret();
  if (!secret) {
    throw new Error("ADMIN_IMPERSONATION_SECRET or CRON_SECRET is required.");
  }

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload)
  );
  return toBase64Url(new Uint8Array(signature));
}

async function hmacVerify(payload: string, signature: string): Promise<boolean> {
  const secret = impersonationSecret();
  if (!secret) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );

  try {
    const sigBytes = Uint8Array.from(fromBase64Url(signature));
    return await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes,
      new TextEncoder().encode(payload)
    );
  } catch {
    return false;
  }
}

export interface ImpersonationPayload {
  adminUserId: string;
  targetUserId: string;
  expiresAt: number;
}

function encodePayload(payload: ImpersonationPayload): string {
  return `${payload.adminUserId}:${payload.targetUserId}:${payload.expiresAt}`;
}

function decodePayload(raw: string): ImpersonationPayload | null {
  const parts = raw.split(":");
  if (parts.length !== 3) return null;

  const [adminUserId, targetUserId, expiresAtRaw] = parts;
  const expiresAt = Number(expiresAtRaw);
  if (!adminUserId || !targetUserId || !Number.isFinite(expiresAt)) {
    return null;
  }

  return { adminUserId, targetUserId, expiresAt };
}

export async function createImpersonationToken(
  adminUserId: string,
  targetUserId: string
): Promise<string> {
  const payload: ImpersonationPayload = {
    adminUserId,
    targetUserId,
    expiresAt: Math.floor(Date.now() / 1000) + MAX_AGE_SEC,
  };
  const encoded = encodePayload(payload);
  const signature = await hmacSign(encoded);
  return `${encoded}.${signature}`;
}

export async function verifyImpersonationToken(
  token: string | undefined,
  expectedAdminUserId: string
): Promise<ImpersonationPayload | null> {
  if (!token) return null;

  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const valid = await hmacVerify(encoded, signature);
  if (!valid) return null;

  const payload = decodePayload(encoded);
  if (!payload) return null;
  if (payload.adminUserId !== expectedAdminUserId) return null;
  if (payload.expiresAt < Math.floor(Date.now() / 1000)) return null;

  return payload;
}

export async function setImpersonationCookie(
  adminUserId: string,
  targetUserId: string
): Promise<void> {
  const token = await createImpersonationToken(adminUserId, targetUserId);
  const cookieStore = await cookies();
  cookieStore.set(IMPERSONATION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SEC,
  });
}

export async function clearImpersonationCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(IMPERSONATION_COOKIE);
}

export async function getImpersonationFromRequestCookies(
  adminUserId: string
): Promise<ImpersonationPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(IMPERSONATION_COOKIE)?.value;
  return verifyImpersonationToken(token, adminUserId);
}

export function getImpersonationTokenFromRequest(
  request: NextRequest
): string | undefined {
  return request.cookies.get(IMPERSONATION_COOKIE)?.value;
}

export async function verifyImpersonationFromRequest(
  request: NextRequest,
  expectedAdminUserId: string
): Promise<ImpersonationPayload | null> {
  const token = getImpersonationTokenFromRequest(request);
  return verifyImpersonationToken(token, expectedAdminUserId);
}
