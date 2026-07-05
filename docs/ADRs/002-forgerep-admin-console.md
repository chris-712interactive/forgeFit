# ADR 002 — ForgeRep Admin Console

**Status:** Proposed  
**Last updated:** 2026-07-05  
**Depends on:** Phase 7 billing (Stripe), community moderation (Phase 6), Supabase Auth

---

## Context

ForgeRep needs a secure internal console for founders/operators to:

- Log in and perform administrative duties
- Search and manage users
- Grant comp upgrades (Pro / Pro+ without charging)
- Apply discounts or credits to paying users
- View ARR/MRR/churn and other revenue metrics
- Monitor growth funnels and community health

Today we have **partial building blocks**:

| Capability | Exists today | Gap |
|------------|--------------|-----|
| Auth | Supabase email/OAuth | No admin role |
| Billing | Stripe checkout, webhooks, plan changes | No comp / manual tier override |
| Moderation | `/community/moderation`, `is_community_moderator` | Community-only, mobile layout |
| Internal APIs | `CRON_SECRET` + `/api/internal/*` | No UI, no human RBAC |
| Profiles | `subscription_tier`, Stripe IDs, `signup_source` | No audit log for admin actions |

Community moderators are **not** admins. Billing changes must never be available to moderators.

---

## Decision

Build a **ForgeRep Admin Console** at `/admin` (desktop-first, separate from the member PWA shell).

### Access model

1. Add `profiles.is_admin boolean default false` (migration).
2. Seed admins via env `ADMIN_USER_IDS` (comma-separated UUIDs) — same pattern as `COMMUNITY_MODERATOR_USER_IDS`.
3. Server-side guard on every `/admin` page and `/api/admin/*` route: `isAdmin(userId)`.
4. Optional hardening: require admin accounts to use email + MFA (Supabase) before enabling `is_admin`.

### Architecture

```
/admin/*           → Next.js pages (desktop layout, Forge Ember)
/api/admin/*       → Route handlers (service role + admin session check)
lib/admin/*        → Queries, Stripe comp helpers, audit log
admin_audit_log    → New Supabase table (who did what, when, to whom)
```

All mutating admin actions write to `admin_audit_log` before returning success.

### Billing operations (Stripe-backed)

| Action | Implementation |
|--------|----------------|
| **Comp upgrade** | Set `profiles.subscription_tier` + `subscription_status = 'active'` with `comp_reason` + `comp_expires_at`. Optionally create Stripe subscription with 100% coupon or skip Stripe entirely for pure comps (tier gates read profile). |
| **Revoke comp** | Revert tier to `free` or restore paid Stripe sub if one existed. |
| **Apply discount** | Stripe Customer → attach coupon / promotion code to existing subscription; store `admin_discount_note` on profile. |
| **Extend trial** | Stripe `trial_end` update on subscription. |

**Rule:** Profile tier is the runtime gate (`gates.ts`). Stripe is source of truth for *paid* users; comps use profile fields + metadata flag `billing_source: 'comp' | 'stripe'`.

### Revenue & growth metrics (v1)

**Revenue dashboard**

- MRR, ARR (MRR × 12)
- Paid subscribers by tier (Pro / Pro+) and interval (monthly / annual)
- New paid subs (7d / 30d)
- Churned / canceled (period)
- Net revenue (Stripe balance transactions, optional v1.1)
- Comp accounts (count + ARR equivalent for reporting)

**Growth dashboard**

- Signups (total, 7d, 30d) — `auth.users` + `profiles.created_at`
- Activation: completed onboarding, first workout logged, first nutrition log
- Signup source breakdown — `profiles.signup_source`
- Free → Pro conversion rate
- Community opt-in rate — reuse `getCommunityMetrics()` WACP / opt-in
- Retention: D7 / D30 workout activity

Data sources: Supabase SQL views + Stripe API (cached 15 min in admin) + existing community metrics.

---

## Phased delivery

### Phase A — Foundation (ship first)

- [ ] `is_admin` column + `admin_audit_log` table
- [ ] `lib/admin/auth.ts` — `requireAdmin()`
- [ ] `/admin` layout (sidebar, desktop)
- [ ] `/admin/login` redirect if not admin
- [ ] **Users** list: search by email, tier, status, signup date
- [ ] **User detail**: profile summary, subscription, Stripe customer link
- [ ] **Comp upgrade** form: tier, expiry date, reason (required)
- [ ] Basic **Overview** cards: total users, paid count, MRR estimate

### Phase B — Revenue & discounts

- [ ] Stripe-backed discount / coupon attach UI
- [ ] ARR/MRR charts (Recharts, 90-day trend)
- [ ] Churn + new MRR widgets
- [ ] Export CSV (users, subscriptions)

### Phase C — Growth ops

- [ ] Funnel visualization (signup → onboard → first workout → paid)
- [ ] Cohort retention table
- [ ] Signup source + experiment breakdown
- [ ] Embed existing community metrics panel
- [ ] Link-out to `/community/moderation` for moderators who are also admins

### Phase D — Advanced (later)

- [ ] Impersonation (read-only “view as user”) with audit
- [ ] Broadcast email / push to segments
- [ ] Feature flags per user
- [ ] Restaurant / ingredient review queues (existing internal APIs → UI)
- [ ] Refund / cancel subscription from admin

---

## Security requirements

- Admin routes return 404 (not 403) for non-admins — avoid leaking `/admin` existence
- No admin powers in client-only code; all mutations via `/api/admin/*`
- Service role key never sent to browser
- Every mutation: `admin_user_id`, `action`, `target_user_id`, `payload jsonb`, `created_at`
- Rate-limit admin API routes
- Comp grants require non-empty `reason` (min 10 chars)

---

## UI routes (proposed)

| Route | Purpose |
|-------|---------|
| `/admin` | Overview — KPI cards, alerts |
| `/admin/users` | Searchable user table |
| `/admin/users/[id]` | Detail + comp / discount actions |
| `/admin/revenue` | MRR, ARR, churn, tier mix |
| `/admin/growth` | Funnels, activation, sources |
| `/admin/community` | Ops metrics (reuse panels) |
| `/admin/audit` | Admin action log |

---

## Mockup

Interactive HTML prototype (open in browser):

`apps/web/content/admin/console-mockup.html`

---

## Open questions

1. **Comp without Stripe** — OK for influencers/beta; do we cap comp seats (e.g. max 50)?
2. **Annual ARR** — report MRR×12 only, or separate annual contract value?
3. **Multi-admin** — single founder initially; defer invite-other-admins flow?
4. **Moderator overlap** — same person can be admin + moderator; separate flags.

---

## References

- `apps/web/src/lib/billing/` — Stripe sync, tier gates
- `apps/web/src/lib/coaching/community-moderation.ts` — moderator pattern
- `apps/web/src/app/api/internal/community-metrics/route.ts` — metrics API
- `docs/TIER-GATES.md` — Pro / Pro+ pricing
