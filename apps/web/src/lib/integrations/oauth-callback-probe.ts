import { NextResponse } from "next/server";

/**
 * Vendor dashboards (Withings Partner Hub, etc.) probe callback URLs with HEAD/GET
 * and reject redirects (307). Real OAuth callbacks always include `code` or `error`.
 */
export function isIntegrationOAuthCallbackProbe(
  request: Request,
  searchParams: URLSearchParams
): boolean {
  if (request.method === "HEAD") return true;
  return (
    request.method === "GET" &&
    !searchParams.has("code") &&
    !searchParams.has("error")
  );
}

export function integrationOAuthCallbackProbeResponse(
  request: Request
): NextResponse {
  if (request.method === "HEAD") {
    return new NextResponse(null, { status: 200 });
  }

  return new NextResponse("OK", {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}
