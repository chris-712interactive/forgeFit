# ADR 002 — ForgeRep Admin Console

**Status:** Phase A shipped · Phase B in progress · Phases C–D planned  
**Last updated:** 2026-07-06  
**Depends on:** Phase 7 billing (Stripe), community moderation (Phase 6), Supabase Auth  
**Phase doc:** [admin-console.md](../phases/admin-console.md) (acceptance criteria + file map)

---

## Context

ForgeRep needs a secure internal console for founders/operators to:

- Log in and perform administrative duties
- Search and manage users
- Grant comp upgrades (Pro / Pro+ without charging)
- Apply discounts or credits to paying users
- View ARR/MRR/churn and other revenue metrics
- Monitor growth funnels and community health

### Building blocks at kickoff

| Capability | Existed before | Gap |
|------------|----------------|-----|
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

1. `profiles.is_admin boolean default false` (migration `20260705120000_admin_console.sql`).
2. Seed admins via env `ADMIN_USER_IDS` (comma-separated UUIDs) — same pattern as `COMMUNITY_MODERATOR_USER_IDS`.
3. Server-side guard on every `/admin` page and `/api/admin/*` route via `requireAdminUser()` / `getAdminApiActor()`.
4. **Separate operator login** at `/admin/login` — distinct from member `/login`; both use Supabase Auth but different entry points and redirects.
5. **Read-only impersonation** — admins view the member app as a target user without signing out (signed httpOnly cookie, audit trail, mutations blocked).
6. Optional hardening (later): require MFA before enabling `is_admin`.

### Auth separation (operator vs member)

| Surface | Login | Session | Purpose |
|---------|-------|---------|---------|
| **Admin console** | `/admin/login` → `/admin` | Same Supabase cookie | Operator tools, comp grants, audit |
| **Member PWA** | `/login` → `/home` | Same Supabase cookie | Normal product use |

**One browser = one Supabase session.** Admin and member logins are separate *entry points*, not concurrent identities. To verify as another user while staying signed in as admin, use **View as user** on `/admin/users/[id]` (impersonation).

**Future (not built):** simultaneous dual sessions via subdomain-scoped cookies (`admin.` vs `app.` origin) — see Open questions.

### Impersonation

- Start: `POST /api/admin/users/[id]/impersonate` from user detail → sets `forge_impersonate` cookie (4h, HMAC-signed).
- Exit: `DELETE /api/admin/impersonate` or banner “Exit to admin”.
- Member pages use `getMemberContext()` → `effectiveUserId` for reads; server actions and non-admin API POSTs return 403 while impersonating.
- Audit actions: `impersonation_start`, `impersonation_end`.
- Cannot impersonate another admin account.

### Architecture

```
/admin/*           → Next.js pages (desktop layout, Forge Ember)
/api/admin/*       → Route handlers (service role + admin session check)
lib/admin/*        → Queries, comp helpers, audit log, metrics
admin_audit_log    → Supabase table (who did what, when, to whom)
```

All mutating admin actions write to `admin_audit_log` before returning success.

### Billing operations

| Action | Implementation | Phase |
|--------|----------------|-------|
| **Comp upgrade** | Set `subscription_tier`, `subscription_status = active`, `billing_source = comp`, `comp_reason`, `comp_expires_at` | A ✅ |
| **Revoke comp** | Clear comp fields; re-sync Stripe if `stripe_subscription_id` exists | A ✅ |
| **Comp expiry** | Lazy revert in `getSubscriptionForUser()` via `expireCompIfNeeded()` | A ✅ |
| **Stripe guard** | `syncSubscriptionToProfile()` skips tier overwrite for active comps | A ✅ |
| **Apply discount** | Stripe coupon on subscription; optional `admin_discount_note` on profile | B |
| **Extend trial** | Stripe `trial_end` update | B |
| **Refund / cancel** | Stripe API from admin UI | D |

**Rule:** Profile tier is the runtime gate (`gates.ts`). Stripe is source of truth for *paid* users; comps use `billing_source: 'comp'`.

### Revenue & growth metrics

**Revenue dashboard (Phase B)**

- MRR, ARR (MRR × 12)
- Paid subscribers by tier (Pro / Pro+) and interval (monthly / annual)
- New paid subs (7d / 30d)
- Churned / canceled (period)
- Net revenue (Stripe balance transactions)
- Comp accounts (count + ARR equivalent)

**Growth dashboard (Phase C)**

- Signups (total, 7d, 30d)
- Activation funnel: onboarding → first workout → first nutrition log → paid
- Signup source breakdown (`profiles.signup_source`)
- Free → Pro conversion rate
- Community opt-in / WACP (`getCommunityMetrics()`)
- D7 / D30 workout retention cohorts

**Phase A + overview Stripe metrics:** Overview KPIs use live Stripe subscriptions for paid counts and MRR (monthly/annual normalized, coupons when present). Profile fallback when Stripe env is incomplete. Comp seats still from Supabase.

Data sources: Supabase SQL + Stripe API (15 min cache) + existing community metrics.

---

## Phased delivery

### Phase A — Foundation ✅ Shipped 2026-07-05

- [x] `is_admin` + comp columns + `admin_audit_log` table
- [x] `lib/admin/auth.ts` — `requireAdminUser()`, `getAdminApiActor()`
- [x] `/admin` layout (sidebar, desktop) — `AdminShell`
- [x] Operator login `/admin/login` (separate from member `/login`)
- [x] Read-only impersonation — view member app as target user with audit trail
- [x] Middleware skips onboarding/disclaimer on `/admin/*`
- [x] **Users** list — search email/name/UUID; filter tier/status
- [x] **User detail** — profile, workouts, Stripe link, comp form
- [x] **Comp upgrade / revoke** — `POST /api/admin/users/[id]/comp`
- [x] **Overview** — MRR/ARR estimate, paid count, comp seats
- [x] **Audit log** — `/admin/audit`

### Phase B — Revenue & discounts (in progress)

- [x] `/admin/revenue` page — MRR, ARR, churn, tier mix, comp ARR equiv., net revenue chart
- [x] New paid (7d/30d), churn (30d), past-due/trialing KPIs
- [x] Net revenue from Stripe balance transactions (15 min cache)
- [x] Subscription CSV export (`GET /api/admin/export/subscriptions`)
- [x] Rate-limit admin API routes
- [ ] Stripe-backed discount / coupon attach UI on user detail
- [ ] Extend trial via Stripe `trial_end`
- [ ] Historical MRR trend (needs daily snapshot table or Stripe Sigma)
- [ ] Users CSV export

### Phase C — Growth ops

- [ ] `/admin/growth` page
- [ ] Funnel visualization (signup → onboard → first workout → paid)
- [ ] Cohort retention table
- [ ] Signup source + experiment breakdown
- [ ] `/admin/community` — embed `CommunityOpsMetricsPanel`
- [ ] Link to `/community/moderation` for dual-role admins

### Phase D — Advanced

- [ ] Broadcast email / push to segments
- [ ] Per-user feature flags
- [ ] Ingredient suggestion review UI (wrap `/api/internal/nutrition-ingredient-suggestions`)
- [ ] Refund / cancel subscription from admin
- [ ] Invite additional admins (UI + `is_admin` toggle)

---

## Security requirements

- Admin routes return **404** (not 403) for non-admins
- No admin powers in client-only code; mutations via `/api/admin/*` only
- `SUPABASE_SERVICE_ROLE_KEY` never sent to browser
- Audit log: `admin_user_id`, `action`, `target_user_id`, `payload`, `created_at`
- Rate-limit admin API routes (Phase B)
- Comp grants require `reason` ≥ 10 characters

---

## Routes

| Route | Status | Purpose |
|-------|--------|---------|
| `/admin/login` | ✅ | Operator sign-in (separate from `/login`) |
| `/admin` | ✅ | Overview KPIs |
| `/admin/users` | ✅ | Searchable user table |
| `/admin/users/[id]` | ✅ | Detail + comp actions |
| `/admin/audit` | ✅ | Admin action log |
| `/admin/revenue` | ✅ | MRR, ARR, churn, tier mix, net revenue |
| `/admin/growth` | Planned C | Funnels, activation, sources |
| `/admin/community` | Planned C | Community ops metrics |

---

## Operator setup

1. Apply migration: `supabase/migrations/20260705120000_admin_console.sql`
2. Set `ADMIN_USER_IDS=<uuid>` in env (comma-separated for multiple)
3. Set `SUPABASE_SERVICE_ROLE_KEY` (required for admin queries)
4. Optional: `UPDATE profiles SET is_admin = true WHERE id = '<uuid>';`
5. Sign in at `/admin/login` → visit `/admin`
6. To verify member UX: user detail → **View as user** (read-only impersonation)

---

## Implemented file map (Phase A)

| Area | Path |
|------|------|
| Migration | `supabase/migrations/20260705120000_admin_console.sql` |
| Auth | `apps/web/src/lib/admin/auth.ts` |
| Impersonation | `apps/web/src/lib/admin/impersonation.ts`, `apps/web/src/lib/auth/member-context.ts` |
| Users | `apps/web/src/lib/admin/users.ts` |
| Comp | `apps/web/src/lib/admin/comp.ts` |
| Metrics | `apps/web/src/lib/admin/metrics.ts`, `stripe-metrics.ts`, `revenue-metrics.ts` |
| Export | `apps/web/src/lib/admin/export-subscriptions.ts`, `GET /api/admin/export/subscriptions` |
| Audit | `apps/web/src/lib/admin/audit.ts` |
| Pages | `apps/web/src/app/admin/**` |
| API | `apps/web/src/app/api/admin/users/[id]/comp/route.ts`, `.../impersonate/route.ts`, `/api/admin/impersonate` |
| UI | `apps/web/src/components/admin/*` |
| Stripe guard | `apps/web/src/lib/billing/sync-subscription.ts` |
| Comp expiry | `apps/web/src/lib/billing/subscription.ts` |

---

## UI mockup

Interactive HTML prototype (design reference — not production UI):

`apps/web/content/admin/console-mockup.html`

---

## Open questions

1. **Comp cap** — unlimited for now; add max comp seats in Phase B?
2. **Annual ARR** — Phase A uses MRR×12 at monthly list price; Phase B should use Stripe interval
3. **Multi-admin invite** — env + DB flag only for now; UI in Phase D
4. **Moderator overlap** — separate flags; same user can hold both
5. **Dual concurrent sessions** — deferred; would need subdomain cookie partitioning (future ADR if required)

---

## References

- [admin-console.md](../phases/admin-console.md) — acceptance criteria
- [ARCHITECTURE.md](../ARCHITECTURE.md) — Admin Console section
- [TIER-GATES.md](../TIER-GATES.md) — Pro / Pro+ pricing
- `apps/web/src/lib/billing/` — Stripe sync, tier gates
- `apps/web/src/lib/coaching/community-moderation.ts` — moderator pattern
- `apps/web/src/app/api/internal/community-metrics/route.ts` — metrics API
