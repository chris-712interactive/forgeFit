import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const PRINT_HTML_PATH = path.join(
  process.cwd(),
  "content/business/5yr-print.html"
);

const ROBOTS_HEADER = "noindex, nofollow, noarchive, nosnippet";

export async function GET() {
  const html = await readFile(PRINT_HTML_PATH, "utf-8");

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Robots-Tag": ROBOTS_HEADER,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
