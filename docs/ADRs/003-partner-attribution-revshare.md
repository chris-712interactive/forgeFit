# ADR 003 — Partner Attribution & Revenue Share

**Status:** Accepted · Phase 14A + 14B code complete (migrations apply ops)  
**Date:** 2026-07-20  
**Last updated:** 2026-07-20  
**Depends on:** Phase 7 billing (Stripe checkout + webhooks), Admin console (Phases A–D)  
**Phase doc:** [14-partner-attribution.md](../phases/14-partner-attribution.md)  
**Related:** [forgeRep-5-year-business-plan.md](../business/businessPlan/forgeRep-5-year-business-plan.md) (Y1 referral, Y2 affiliate 20%, Y3+ partnership channel)

---

## Phase 0 decisions (locked 2026-07-20)

| Topic | Decision |
|-------|----------|
| **Commission base** | **Per deal**, not global. Enum: `gross`, `net_of_fees` (default influencer/affiliate), `net_of_fees_and_tax`. Gym deals often start as `gross` or CPA — override per contract. |
| **Click window** | Influencer/affiliate template **30 days**; gym template **90 days**. Override per `partner_deals.click_window_days`. |
| **Residual duration** | Default **12 months** (`duration_months = 12`). **`duration_months` null = life of the subscription** (earn while paid invoices continue; stop after cancel / no further paid invoices). |
| **Attribution model** | First durable touch (default). Last-touch available per deal if a contract requires it. |
| **Pay trigger** | Stripe `invoice.paid` only; comps excluded (Phase B). |
| **Refunds** | Reversing ledger rows (Phase B). |

---

## Context

ForgeRep needs a flexible way to attribute signups and paid conversions to **gym partners** (e.g. EoS Fitness in-app ads), **influencers/creators**, and **affiliate marketers**, then compute and pay revenue share.

### Building blocks today

| Capability | Exists | Gap |
|------------|--------|-----|
| Stripe Checkout + webhooks | Yes — `user_id` + `tier` metadata only | No partner stamp on subscription |
| Admin revenue / growth | Yes — MRR, funnel, `signup_source` | `signup_source` = prior app (onboarding), not acquisition partner |
| Marketing UTMs | Documented in calendars / launch docs | `/signup` does not persist UTMs or partner cookies |
| Comp billing | Yes — `billing_source = comp` | Useful for micro-influencer comps; not rev-share ledger |
| Referral / invite | Planned in business plan | Not built |

Buying Impact/PartnerStack early would add cost and lock-in before deal volume justifies it. A **first-party Partner Attribution + Commission Ledger** fits the existing Next.js + Supabase + Stripe stack and Admin console.

---

## Decision

Build one **Partner** subsystem. Gyms, influencers, and affiliates are partner *types* with versioned *deals* — not separate products.

### Core principles

1. **One attribution pipeline** — tracked link, promo code, and deep link all resolve to the same partner + deal.
2. **Pay on cash received** — commission accrues on successful Stripe `invoice.paid` (net of fees/refunds per deal policy), never on free signup alone.
3. **Deals are data** — commission %, duration, CPA, click window, and attribution model live in `partner_deals`, not hard-coded constants.
4. **First durable touch wins** (default) — prevents affiliate last-click hijacking of gym/creator attribution. Admin override with audit.
5. **Exclude comps** — `billing_source = comp` never generates commission.
6. **Stay first-party** until ≥50 active cash partners — then optionally evaluate Stripe Connect automation or a network (Impact/PartnerStack).

### Do not conflate

| Field / concept | Purpose |
|-----------------|---------|
| `profiles.signup_source` | Optional onboarding “previous app” (MFP, Strong, etc.) |
| Partner attribution | Who drove acquisition (EoS, creator, affiliate) |
| Member referral (later) | Peer invite credits — same attribution tables optional, **non-cash** rewards via Stripe coupon / balance |

---

## Architecture

```
/r/[slug] or ?code=… or gym deep link
        ↓
Cookie (ff_ref) + attribution_events
        ↓
Signup → user_attributions (durable)
        ↓
Stripe Checkout metadata (partner_id, attribution_id)
        ↓
invoice.paid webhook → commission engine
        ↓
partner_commissions ledger → admin report / payout batch
```

### Schema (logical)

| Table | Role |
|-------|------|
| `partners` | Identity: slug, type (`gym` \| `influencer` \| `affiliate` \| `referral` \| `other`), status, contact, payout method |
| `partner_deals` | Versioned terms: % bps, CPA, duration months, click window, attribution model, eligible tiers, effective dates |
| `partner_codes` | Human codes (`EOS20`, `ALEX`) → partner; optional Stripe promo linkage later |
| `attribution_events` | Immutable click/landing log (pre- and post-auth) |
| `user_attributions` | Durable per-user partner stamp (first-touch default; admin override audited) |
| `partner_commissions` | Append-only ledger (pending / payable / paid / reversed); idempotent on Stripe invoice id |
| `partner_payouts` | Monthly batch marked paid + external reference |

Optional denormalized `profiles.acquisition_partner_id` for admin filters — keep `user_attributions` as source of truth.

### Integration points (existing code)

| Surface | Change |
|---------|--------|
| `apps/web/src/app/api/stripe/checkout/route.ts` | Add `partner_id` / `attribution_id` to session + subscription metadata |
| `apps/web/src/app/api/stripe/webhook/route.ts` | On `invoice.paid` (and refunds), enqueue or run commission accrual |
| `syncSubscriptionToProfile` | Do not overwrite partner attribution; partner is orthogonal to tier |
| Admin console | Partners CRUD, ledger, CSV export for gym monthly packs |
| Inngest (preferred) or inline webhook | Idempotent commission job so Stripe retries stay fast |

### Attribution capture

1. **Vanity URL:** `https://forge-rep.com/r/{slug}` (+ optional `club`, `utm_*`)
2. **Promo code** at signup or checkout → same partner resolution
3. **Gym deep link** into PWA (HTTPS preferred) → same `/r/[slug]` resolver
4. **Cookie:** first-party `ff_ref` (HttpOnly, Secure, SameSite=Lax), TTL = deal click window
5. **On signup / first auth:** stamp `user_attributions` if cookie/code present and no durable attribution yet

### Commission computation (Phase B)

```
if billing_source == comp → skip
if no user_attribution → skip
if duration_months is set AND months_since_attribution > duration_months → skip
  # duration_months null → life of subscription (any later paid invoice while attributed)
base = amount per deal.commission_base (gross | net_of_fees | net_of_fees_and_tax)
commission = base × deal.percent_bps / 10000
  (+ one-time CPA on first paid invoice if hybrid)
insert partner_commissions (status = pending)
on refund → insert reversing row referencing original
```

### Channel defaults (templates — override per contract)

| Type | Click window | Residual | Commission base | Typical % |
|------|--------------|----------|-----------------|-----------|
| Influencer | 30 days | 12 mo or **lifetime** | `net_of_fees` | 20% |
| Affiliate | 30 days | 12 mo | `net_of_fees` | 15–25% |
| Gym (EoS) | 90 days | 12–24 mo or **lifetime** | `gross` or CPA | Negotiated |
| Member referral | — | — | Non-cash credits | Phase E |

---

## Phased delivery

| Sub-phase | Scope | Outcome |
|-----------|--------|---------|
| **0 — Commercial rules** | Lock net base, windows, first-touch, tax/W-9 | Engineering unblocked |
| **A — Capture** | Schema, `/r/[slug]`, cookie, signup stamp, checkout metadata | EoS/creator links work; no auto payout yet |
| **B — Ledger** | Webhook → commissions; admin partners + CSV | Runnable rev-share ops |
| **C — Portal** | Read-only partner dashboard | Self-serve creators/affiliates |
| **D — Payouts** | Stripe Connect or automated batch | Scale beyond manual ACH |
| **E — Referrals** | Member invite credits | Viral loop (business plan Y1 Q4) |

Do not block Phases 11–13 product gates on this work. Treat as **growth infra** parallel to MVP completion.

---

## Consequences

### Positive

- One system serves EoS, influencers, and affiliates with deal-row flexibility
- Auditable ledger aligned with Stripe cash events
- Admin console already exists for ops UI
- Avoids early network fees and last-click hijacking of gym deals

### Trade-offs

- Manual payouts until Connect (acceptable at low partner count)
- Must maintain finance policy docs (net definition, clawbacks)
- Cookie attribution imperfect on cross-device; promo codes mitigate

### Explicit non-goals (this ADR)

- White-label coach product / gym-branded app shell (Y4 business plan)
- Paying commission on free signups
- Hard-coded 20% in application logic
- Replacing `signup_source` (prior app) with partner id

---

## Open questions

1. **EoS contract:** % vs CPA vs hybrid; club-level reporting required?
2. **Net definition:** subtract Stripe fees and/or sales tax before %?
3. **Annual invoices:** commission on full invoice cash vs recognize monthly — default **cash on invoice**.
4. **EU cookie consent:** defer until EU traffic material (business plan Y4); US-first first-party cookie OK for pilot.
5. **Partner portal auth:** magic link vs flag on `profiles` vs separate partner users table.

---

## Success metrics

| Metric | Target |
|--------|--------|
| Attributed partner-link conversions stamped | ≥80% |
| Ledger vs Stripe invoice reconciliation | 0 unexplained diffs / month |
| Influencer/affiliate CAC | $25–40 target (business plan guardrail) |
| Gym monthly report turnaround | &lt;1 business day (CSV from admin) |
