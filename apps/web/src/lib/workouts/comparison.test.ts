import assert from "node:assert/strict";
import test from "node:test";
import { formatShortDate } from "./comparison";

test("formatShortDate keeps calendar ISO dates on the intended local day", () => {
  const formatted = formatShortDate("2026-07-15");
  assert.match(formatted, /Jul/);
  assert.match(formatted, /15/);
  assert.doesNotMatch(formatted, /14/);
});

test("formatShortDate formats full timestamps", () => {
  const formatted = formatShortDate("2026-07-15T18:30:00.000Z");
  assert.match(formatted, /Jul/);
  assert.match(formatted, /\d{1,2}/);
});
