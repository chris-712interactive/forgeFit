# Phase 14 — Partner Attribution & Revenue Share

**Status:** Phase 0 locked · Phase 14A in progress  
**ADR:** [003-partner-attribution-revshare.md](../ADRs/003-partner-attribution-revshare.md)  
**Depends on:** Phase 7 billing (Stripe), Admin console (Phases A–D)  
**Does not block:** Phases 11–13 product / device QA

## Goal

Attribute signups and paid conversions to gyms (e.g. EoS), influencers, and affiliates via one Partner subsystem; accrue rev-share on Stripe cash events; operate deals from Admin (portal + Connect later).

## Phase 0 — Commercial rules

- [x] Commission base: **per deal** (`gross` \| `net_of_fees` \| `net_of_fees_and_tax`); influencer/affiliate default `net_of_fees`
- [x] Default attribution: first durable touch
- [x] Click windows: influencer/affiliate **30d**, gym **90d** (override per deal)
- [x] Residual: default **12 months**; **`duration_months` null = life of subscription**
- [ ] Self-referral / staff abuse policy (enforce in Phase B; block same user as partner contact in A where easy)
- [ ] Payout cadence (e.g. monthly Net-30) and minimum threshold — Phase B
- [ ] W-9 / tax collection before first cash payout — Phase B/D
- [ ] EoS (or first gym) term sheet draft: %, duration, reporting, brand, discount funding — ops, not code gate for 14A

---

## Phase A — Capture ✅ Unblocks live tracked links

### Done when

- [x] Migration: `partners`, `partner_deals`, `partner_codes`, `attribution_events`, `user_attributions`
- [x] RLS: service role / admin write; members can select own `user_attributions` only
- [x] `GET /r/[slug]`: resolve active partner → set `ff_ref` cookie → log `attribution_events` → redirect to landing
- [x] Optional query params stored: `utm_*`, `club`, `campaign`
- [x] Promo code path via `partner_codes` + `/signup?code=` / `/signup?ref=` bounce through `/r/`
- [x] On signup / auth callback / claim API: stamp `user_attributions` (first durable touch)
- [x] Stripe Checkout session + `subscription_data.metadata` include `partner_id` + `attribution_id` when present
- [x] Admin: create/edit partner status + deal template defaults (`/admin/partners`)
- [ ] Seed at least one test partner in non-prod (ops — create via Admin after migration apply)
- [ ] Migration `20260720150000_partner_attribution.sql` applied in Supabase (ops)
- [x] Unit tests for templates, residual lifetime, cookie codec
- [x] `pnpm turbo typecheck` passes
- [x] Docs: PROGRESS + this checklist updated

### Out of scope for A

- Commission ledger, partner portal, Stripe Connect, member referrals

### Files

| Area | Path |
|------|------|
| Migration | `supabase/migrations/20260720150000_partner_attribution.sql` |
| Redirect | `apps/web/src/app/r/[slug]/route.ts` |
| Lib | `apps/web/src/lib/partners/*` |
| Claim API | `apps/web/src/app/api/partners/claim/route.ts` |
| Checkout | `apps/web/src/app/api/stripe/checkout/route.ts` |
| Signup / auth | `apps/web/src/app/signup/page.tsx`, `apps/web/src/app/auth/callback/route.ts` |
| Admin UI | `apps/web/src/app/admin/(authenticated)/partners/*`, `lib/admin/partners.ts` |

---

## Phase B — Commission ledger ✅ Runnable rev-share ops

### Done when

- [ ] Migration: `partner_commissions`, `partner_payouts` (+ indexes; unique on Stripe invoice id for accruals)
- [ ] On `invoice.paid`: resolve user attribution + active deal → insert `pending` commission (idempotent)
- [ ] Comp accounts (`billing_source = comp`) skipped
- [ ] Refund / chargeback path inserts reversing ledger rows
- [ ] Deal `duration_months` and tier eligibility enforced
- [ ] Admin: commission ledger list/filter by partner + month
- [ ] Admin: mark payout batch paid (`partner_payouts`)
- [ ] Admin: CSV export suitable for gym monthly pack (signups, paid conversions, net, commission)
- [ ] Optional: Inngest job for accrual (preferred over heavy webhook body)
- [ ] Unit tests for commission math (percent, CPA hybrid, refund reverse, window expiry)
- [ ] `pnpm turbo typecheck` passes

### Files (expected)

| Area | Path |
|------|------|
| Migration | `supabase/migrations/YYYYMMDDHHMMSS_partner_commissions.sql` |
| Engine | `apps/web/src/lib/partners/commission.ts` |
| Webhook | `apps/web/src/app/api/stripe/webhook/route.ts` |
| Admin | revenue/partners ledger UI + `GET /api/admin/export/partner-commissions` |

---

## Phase C — Partner portal (optional until volume)

### Done when

- [ ] Partner login (magic link or flagged account) — decision recorded in ADR open questions
- [ ] Read-only dashboard: clicks, signups, paid conversions, estimated commission
- [ ] Display unique link + codes
- [ ] Gym view: optional breakdown by `club` param when present
- [ ] No partner write access to deals or ledger status

---

## Phase D — Automated payouts (scale)

### Done when

- [ ] Stripe Connect Express (or documented manual batch remains default)
- [ ] Monthly job creates transfer / export from `payable` commissions
- [ ] Tax / W-9 gate before first payout

---

## Phase E — Member referrals (related)

### Done when

- [ ] Invite code / link reuses attribution tables with `type=referral` (or dedicated referral codes)
- [ ] Reward is **non-cash** (Stripe coupon / customer balance) — “give a month, get a month”
- [ ] Self-referral blocked
- [ ] Aligns with business plan Y1 Q4 referral v1

---

## Channel playbooks (ops, not code gates)

### Gym / EoS

1. Partner slug e.g. `eos`; deep links `https://forge-rep.com/r/eos?club={id}&campaign=app_banner`
2. Optional co-branded landing `/for/eos` (convert only — no dashboard clutter)
3. Share **aggregate** metrics; PII only if contract + consent require it
4. Pay on first paid invoice; staff self-signup monitoring

### Influencers

1. Vanity `/r/{handle}` + spoken code
2. Micro: start with admin **comp** Pro; graduate to % deal
3. Store disclosure acknowledgment on partner onboarding when portal exists

### Affiliates

1. Same Partner rows; tighter click windows in deal
2. Apply form → `partners.status = pending`
3. Stay first-party until volume justifies a network

---

## Success metrics

| Metric | Target |
|--------|--------|
| Partner-link conversions with durable stamp | ≥80% |
| Monthly ledger ↔ Stripe reconcile | 0 unexplained diffs |
| Influencer/affiliate CAC | $25–40 (business plan) |
| Gym report turnaround | &lt;1 business day |

## Marking complete

- Mark **Phase A Complete** in PROGRESS only when Phase A checklist passes.
- Mark **Phase 14 Complete** only when A + B are done (C–E optional follow-ons unless a live deal requires them).
