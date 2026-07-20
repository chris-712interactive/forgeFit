import test from "node:test";
import assert from "node:assert/strict";
import {
  dealTemplateForPartnerType,
  isResidualActive,
  isValidPartnerCode,
  isValidPartnerSlug,
  normalizePartnerCode,
  normalizePartnerSlug,
} from "./types";
import {
  parsePartnerRefCookie,
  serializePartnerRefCookie,
} from "./cookie-codec";

test("influencer template: 30-day click, net_of_fees, 12-mo residual", () => {
  const t = dealTemplateForPartnerType("influencer");
  assert.equal(t.clickWindowDays, 30);
  assert.equal(t.commissionBase, "net_of_fees");
  assert.equal(t.durationMonths, 12);
  assert.equal(t.percentBps, 2000);
});

test("gym template: 90-day click, gross, 12-mo residual", () => {
  const t = dealTemplateForPartnerType("gym");
  assert.equal(t.clickWindowDays, 90);
  assert.equal(t.commissionBase, "gross");
  assert.equal(t.durationMonths, 12);
});

test("null duration_months means life of subscription residual", () => {
  const attributedAt = new Date("2024-01-01T00:00:00.000Z");
  assert.equal(
    isResidualActive({
      durationMonths: null,
      attributedAt,
      asOf: new Date("2030-01-01T00:00:00.000Z"),
    }),
    true
  );
});

test("fixed-month residual expires after duration", () => {
  const attributedAt = new Date("2024-01-01T00:00:00.000Z");
  assert.equal(
    isResidualActive({
      durationMonths: 12,
      attributedAt,
      asOf: new Date("2024-06-01T00:00:00.000Z"),
    }),
    true
  );
  assert.equal(
    isResidualActive({
      durationMonths: 12,
      attributedAt,
      asOf: new Date("2025-02-01T00:00:00.000Z"),
    }),
    false
  );
});

test("slug and code helpers normalize and validate", () => {
  assert.equal(normalizePartnerSlug(" Eos "), "eos");
  assert.equal(isValidPartnerSlug("eos"), true);
  assert.equal(isValidPartnerSlug("EoS"), false);
  assert.equal(normalizePartnerCode(" eos20 "), "EOS20");
  assert.equal(isValidPartnerCode("EOS20"), true);
});

test("partner ref cookie round-trips", () => {
  const raw = serializePartnerRefCookie({
    slug: "eos",
    visitorId: "vid-1",
    clickedAt: "2026-07-20T12:00:00.000Z",
    club: "123",
  });
  const parsed = parsePartnerRefCookie(raw);
  assert.equal(parsed?.slug, "eos");
  assert.equal(parsed?.visitorId, "vid-1");
  assert.equal(parsed?.club, "123");
});
