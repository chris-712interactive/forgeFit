#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { execFileSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const mdPath = join(__dirname, "forgeRep-5-year-business-plan.md");
const htmlPath = join(__dirname, "forgeRep-5-year-business-plan.html");
const pdfPath = join(__dirname, "forgeRep-5-year-business-plan.pdf");
const webHtmlPath = join(
  __dirname,
  "../../apps/web/content/business/5yr-print.html"
);

function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function inlineFormat(s) {
  return escapeHtml(s)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

function mdToHtml(md) {
  const lines = md.split("\n");
  const out = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (/^---+$/.test(line.trim())) {
      out.push("<hr />");
      i++;
      continue;
    }

    const h = line.match(/^(#{1,6})\s+(.+)$/);
    if (h) {
      const level = h[1].length;
      out.push(`<h${level}>${inlineFormat(h[2])}</h${level}>`);
      i++;
      continue;
    }

    if (line.startsWith("|")) {
      const rows = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        rows.push(
          lines[i]
            .split("|")
            .slice(1, -1)
            .map((c) => c.trim())
        );
        i++;
      }
      if (rows.length >= 2 && rows[1].every((c) => /^[-:]+$/.test(c))) {
        rows.splice(1, 1);
      }
      out.push("<table>");
      rows.forEach((row, idx) => {
        const tag = idx === 0 ? "th" : "td";
        out.push(
          "<tr>" +
            row.map((c) => `<${tag}>${inlineFormat(c)}</${tag}>`).join("") +
            "</tr>"
        );
      });
      out.push("</table>");
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      out.push("<ul>");
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        out.push(`<li>${inlineFormat(lines[i].replace(/^[-*]\s+/, ""))}</li>`);
        i++;
      }
      out.push("</ul>");
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      out.push("<ol>");
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        out.push(
          `<li>${inlineFormat(lines[i].replace(/^\d+\.\s+/, ""))}</li>`
        );
        i++;
      }
      out.push("</ol>");
      continue;
    }

    if (line.trim() === "") {
      i++;
      continue;
    }

    out.push(`<p>${inlineFormat(line)}</p>`);
    i++;
  }

  return out.join("\n");
}

const sharedStyles = `
  h1 { font-size: 22pt; color: #ff6b35; margin: 0 0 12pt; page-break-after: avoid; }
  h2 { font-size: 14pt; color: #ff6b35; margin: 20pt 0 8pt; border-bottom: 1px solid #e7e5e4; padding-bottom: 4pt; page-break-after: avoid; }
  h3 { font-size: 12pt; margin: 14pt 0 6pt; page-break-after: avoid; }
  h4 { font-size: 11pt; margin: 10pt 0 4pt; page-break-after: avoid; }
  p { margin: 0 0 8pt; }
  ul, ol { margin: 0 0 10pt 18pt; padding: 0; }
  li { margin-bottom: 3pt; }
  table { width: 100%; border-collapse: collapse; margin: 8pt 0 14pt; font-size: 9.5pt; page-break-inside: avoid; }
  th, td { border: 1px solid #d6d3d1; padding: 5pt 6pt; text-align: left; vertical-align: top; }
  th { background: #292524; color: #fafaf9; font-weight: 600; }
  tr:nth-child(even) td { background: #fafaf9; }
  hr { border: none; border-top: 1px solid #e7e5e4; margin: 16pt 0; }
  code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 9pt; background: #f5f5f4; padding: 1pt 3pt; border-radius: 3pt; }
  a { color: #ff6b35; text-decoration: none; }
  strong { font-weight: 600; }
`;

function buildPrintHtml(body) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>ForgeRep — 5-Year Business Plan</title>
<style>
  @page { margin: 18mm 16mm; size: letter; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    font-size: 10.5pt;
    line-height: 1.45;
    color: #1c1917;
    max-width: 100%;
    margin: 0;
    padding: 0;
  }
  ${sharedStyles}
</style>
</head>
<body>
${body}
</body>
</html>`;
}

function buildWebHtml(body) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow, noarchive, nosnippet" />
<title>ForgeRep — 5-Year Business Plan</title>
<style>
  @page { margin: 18mm 16mm; size: letter; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    font-size: 10.5pt;
    line-height: 1.45;
    color: #1c1917;
    margin: 0;
    padding: 0;
  }
  ${sharedStyles}
  .page {
    max-width: 8.5in;
    margin: 0 auto;
    padding: 0.5in 0.55in;
    background: #fff;
  }
  .confidential {
    font-size: 9pt;
    color: #57534e;
    margin-top: 24pt;
    padding-top: 12pt;
    border-top: 1px solid #e7e5e4;
  }
  @media print {
    .no-print { display: none !important; }
    .page { max-width: none; padding: 0; }
  }
  @media screen {
    body { background: #ececec; padding: 1rem 0 2rem; }
    .page { box-shadow: 0 2px 12px rgba(0,0,0,0.12); margin-bottom: 1.5rem; }
    .print-bar {
      max-width: 8.5in;
      margin: 0 auto 1rem;
      padding: 0.75rem 1rem;
      background: #1c1917;
      color: #fff;
      border-radius: 8px;
      font-size: 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .print-bar button {
      background: #ff6b35;
      color: #fff;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
    }
  }
</style>
</head>
<body>
  <div class="print-bar no-print">
    <span>ForgeRep 5-Year Plan — confidential · Print (⌘P) · not indexed</span>
    <button type="button" onclick="window.print()">Print</button>
  </div>
  <div class="page">
${body}
    <p class="confidential">Confidential — ForgeRep / forgeFit. Internal planning only.</p>
  </div>
</body>
</html>`;
}

const md = readFileSync(mdPath, "utf8");
const body = mdToHtml(md);

writeFileSync(htmlPath, buildPrintHtml(body));

mkdirSync(dirname(webHtmlPath), { recursive: true });
writeFileSync(webHtmlPath, buildWebHtml(body));
console.log(`Web HTML written: ${webHtmlPath}`);

const htmlOnly = process.argv.includes("--html-only");
const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

if (htmlOnly || !existsSync(chrome)) {
  if (!htmlOnly && !existsSync(chrome)) {
    console.log("Chrome not found — skipped PDF (HTML files updated).");
  }
  console.log(`Print HTML written: ${htmlPath}`);
  process.exit(0);
}

execFileSync(
  chrome,
  [
    "--headless=new",
    "--disable-gpu",
    "--no-pdf-header-footer",
    `--print-to-pdf=${pdfPath}`,
    htmlPath,
  ],
  { stdio: "inherit" }
);

console.log(`PDF written: ${pdfPath}`);
