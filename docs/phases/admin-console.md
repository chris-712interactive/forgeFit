# Admin Console — Operator Tools

**Status:** Phase A shipped (2026-07-05) · Phase B shipped (2026-07-06) · Phases C–D planned  
**ADR:** [002-forgerep-admin-console.md](../ADRs/002-forgerep-admin-console.md)  
**Mockup:** `apps/web/content/admin/console-mockup.html`  
**Depends on:** Phase 7 billing (Stripe), Supabase Auth, community metrics (Phase 6+)

## Goal

Secure internal console at `/admin` for founders/operators to manage users, comp upgrades, revenue metrics, and growth funnels — separate from the member PWA and community moderator tools.

## Operator setup

1. Apply migration `supabase/migrations/20260705120000_admin_console.sql`
2. Set `ADMIN_USER_IDS=<uuid>` (comma-separated for multiple admins)
3. Set `SUPABASE_SERVICE_ROLE_KEY` (required for admin queries)
4. Set `ADMIN_IMPERSONATION_SECRET` or reuse `CRON_SECRET` (required for view-as-user cookie signing)
5. Optional: `UPDATE profiles SET is_admin = true WHERE id = '<uuid>';`
6. Sign in at **`/admin/login`** → visit `/admin`
7. Member app sign-in stays at **`/login`** — use **View as user** on user detail to verify member UX without signing out of admin

### Auth separation

| Surface | Login URL | Notes |
|---------|-----------|-------|
| Admin console | `/admin/login` | Redirects to `/admin`; non-admins see clear error |
| Member PWA | `/login` | Redirects to `/home` (or onboarding) |

One browser profile holds one Supabase session at a time. Impersonation lets operators preview another member's experience while keeping the admin session.

---

## Phase A — Foundation ✅ Shipped 2026-07-05

### Done when

- [x] `profiles.is_admin`, comp columns (`billing_source`, `comp_reason`, `comp_expires_at`), `admin_audit_log` table
- [x] `requireAdminUser()` / `getAdminApiActor()` guard all `/admin` pages and `/api/admin/*`
- [x] Non-admins receive **404** (not 403)
- [x] `/admin` desktop layout with sidebar (`AdminShell`)
- [x] **`/admin/login`** — operator sign-in separate from member `/login`
- [x] Middleware skips onboarding/disclaimer redirects on `/admin/*`
- [x] **Read-only impersonation** — view member app as target user; audit `impersonation_start` / `impersonation_end`; block mutations
- [x] **Users** — search email/name/UUID; filter tier/status; paginated table
- [x] **User detail** — profile fields, workout count, Stripe customer link, comp form, **View as user**
- [x] **Comp upgrade / revoke** — `POST /api/admin/users/[id]/comp` with reason (≥10 chars) + optional expiry
- [x] **Comp expiry** — lazy revert in `getSubscriptionForUser()`; Stripe webhook skips active comps
- [x] **Overview** — total users, paid count, estimated MRR/ARR, comp seats
- [x] **Audit log** — `/admin/audit` with immutable action history
- [x] All mutating actions write to `admin_audit_log` before success response

### File map

| Area | Path |
|------|------|
| Migration | `supabase/migrations/20260705120000_admin_console.sql` |
| Auth | `apps/web/src/lib/admin/auth.ts` |
| Impersonation | `apps/web/src/lib/admin/impersonation.ts`, `apps/web/src/lib/auth/member-context.ts` |
| Users | `apps/web/src/lib/admin/users.ts` |
| Comp | `apps/web/src/lib/admin/comp.ts` |
| Metrics | `apps/web/src/lib/admin/metrics.ts`, `stripe-metrics.ts`, `revenue-metrics.ts` |
| Audit | `apps/web/src/lib/admin/audit.ts` |
| Pages | `apps/web/src/app/admin/(authenticated)/**`, `apps/web/src/app/admin/login/**` |
| API | `apps/web/src/app/api/admin/users/[id]/comp/route.ts`, `.../impersonate/route.ts`, `/api/admin/impersonate` |
| UI | `apps/web/src/components/admin/*`, `apps/web/src/components/auth/impersonation-banner.tsx` |
| Stripe guard | `apps/web/src/lib/billing/sync-subscription.ts` |
| Comp expiry | `apps/web/src/lib/billing/subscription.ts` |

---

## Phase B — Revenue & discounts (in progress)

### Done when

- [x] `/admin/revenue` page with MRR, ARR (MRR × 12), paid subs by tier/interval
- [x] Accurate MRR from Stripe (monthly vs annual interval, not list-price estimate) — overview KPIs
- [x] New paid subs (7d / 30d), churned/canceled counts, past-due alerts
- [x] Net revenue from Stripe balance transactions (15 min cache)
- [x] Comp accounts count + ARR equivalent
- [x] Net revenue trend chart (Recharts, 90-day weekly)
- [x] Export CSV (subscriptions — paid Stripe + comp)
- [x] Rate-limit `/api/admin/*` routes
- [x] ARR/MRR trend charts — daily snapshots in `admin_revenue_snapshots` (90d MRR line chart)
- [x] Stripe discount / coupon attach UI on user detail
- [x] Export CSV (users)
- [ ] ~~Extend trial via Stripe `trial_end` update~~ — **N/A** (freemium model; no product trials)

---

## Phase C — Growth ops

### Done when

- [ ] `/admin/growth` page
- [ ] Signups (total, 7d, 30d)
- [ ] Activation funnel: onboarding → first workout → first nutrition log → paid
- [ ] Signup source breakdown (`profiles.signup_source`)
- [ ] Free → Pro conversion rate
- [ ] D7 / D30 workout retention cohort table
- [ ] `/admin/community` — community opt-in, WACP (`getCommunityMetrics()`)
- [ ] Link to `/community/moderation` for dual-role admins

---

## Phase D — Advanced

### Done when

- [ ] Broadcast email / push to user segments
- [ ] Per-user feature flags
- [ ] Ingredient suggestion review UI (wrap `/api/internal/nutrition-ingredient-suggestions`)
- [ ] Refund / cancel subscription from admin UI
- [ ] Invite additional admins (UI + `is_admin` toggle)
- [ ] Optional: MFA required before enabling `is_admin`
- [ ] Optional: simultaneous dual sessions via subdomain cookie partitioning (future ADR)

---

## Security checklist (all phases)

- Admin routes return 404 for non-admins
- No admin powers in client-only code; mutations via `/api/admin/*` only
- `SUPABASE_SERVICE_ROLE_KEY` never sent to browser
- Impersonation cookie is httpOnly, HMAC-signed, scoped to admin session user id
- Member mutations blocked during impersonation (server actions + non-admin API POST)
- Audit log fields: `admin_user_id`, `action`, `target_user_id`, `payload`, `created_at`
- Community moderators (`is_community_moderator`) are **not** admins — billing changes never available to moderators

---

## Routes

| Route | Phase | Purpose |
|-------|-------|---------|
| `/admin/login` | A ✅ | Operator sign-in |
| `/admin` | A ✅ | Overview KPIs |
| `/admin/users` | A ✅ | Searchable user table |
| `/admin/users/[id]` | A ✅ | Detail + comp + view-as-user |
| `/admin/audit` | A ✅ | Admin action log |
| `/admin/revenue` | B ✅ | MRR, ARR, churn, tier mix, net revenue chart |
| `/admin/growth` | C | Funnels, activation, sources |
| `/admin/community` | C | Community ops metrics |
