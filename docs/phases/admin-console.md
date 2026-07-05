# Admin Console — Operator Tools

**Status:** Phase A shipped (2026-07-05) · Phases B–D planned  
**ADR:** [002-forgerep-admin-console.md](../ADRs/002-forgerep-admin-console.md)  
**Mockup:** `apps/web/content/admin/console-mockup.html`  
**Depends on:** Phase 7 billing (Stripe), Supabase Auth, community metrics (Phase 6+)

## Goal

Secure internal console at `/admin` for founders/operators to manage users, comp upgrades, revenue metrics, and growth funnels — separate from the member PWA and community moderator tools.

## Operator setup

1. Apply migration `supabase/migrations/20260705120000_admin_console.sql`
2. Set `ADMIN_USER_IDS=<uuid>` (comma-separated for multiple admins)
3. Set `SUPABASE_SERVICE_ROLE_KEY` (required for admin queries)
4. Optional: `UPDATE profiles SET is_admin = true WHERE id = '<uuid>';`
5. Sign in at `/login?redirect=/admin` → visit `/admin`

---

## Phase A — Foundation ✅ Shipped 2026-07-05

### Done when

- [x] `profiles.is_admin`, comp columns (`billing_source`, `comp_reason`, `comp_expires_at`), `admin_audit_log` table
- [x] `requireAdminUser()` / `getAdminApiActor()` guard all `/admin` pages and `/api/admin/*`
- [x] Non-admins receive **404** (not 403)
- [x] `/admin` desktop layout with sidebar (`AdminShell`)
- [x] `/login?redirect=/admin` for operator sign-in
- [x] **Users** — search email/name/UUID; filter tier/status; paginated table
- [x] **User detail** — profile fields, workout count, Stripe customer link, comp form
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
| Users | `apps/web/src/lib/admin/users.ts` |
| Comp | `apps/web/src/lib/admin/comp.ts` |
| Metrics | `apps/web/src/lib/admin/metrics.ts` |
| Audit | `apps/web/src/lib/admin/audit.ts` |
| Pages | `apps/web/src/app/admin/**` |
| API | `apps/web/src/app/api/admin/users/[id]/comp/route.ts` |
| UI | `apps/web/src/components/admin/*` |
| Stripe guard | `apps/web/src/lib/billing/sync-subscription.ts` |
| Comp expiry | `apps/web/src/lib/billing/subscription.ts` |

---

## Phase B — Revenue & discounts

### Done when

- [ ] `/admin/revenue` page with MRR, ARR (MRR × 12), paid subs by tier/interval
- [ ] Accurate MRR from Stripe (monthly vs annual interval, not list-price estimate)
- [ ] New paid subs (7d / 30d), churned/canceled counts, past-due alerts
- [ ] Net revenue from Stripe balance transactions (15 min cache)
- [ ] Comp accounts count + ARR equivalent
- [ ] ARR/MRR trend charts (Recharts, 90-day)
- [ ] Stripe discount / coupon attach UI on user detail
- [ ] Extend trial via Stripe `trial_end` update
- [ ] Export CSV (users, subscriptions)
- [ ] Rate-limit `/api/admin/*` routes

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

- [ ] Read-only impersonation (“view as user”) with audit trail
- [ ] Broadcast email / push to user segments
- [ ] Per-user feature flags
- [ ] Ingredient suggestion review UI (wrap `/api/internal/nutrition-ingredient-suggestions`)
- [ ] Refund / cancel subscription from admin UI
- [ ] Invite additional admins (UI + `is_admin` toggle)
- [ ] Optional: MFA required before enabling `is_admin`

---

## Security checklist (all phases)

- Admin routes return 404 for non-admins
- No admin powers in client-only code; mutations via `/api/admin/*` only
- `SUPABASE_SERVICE_ROLE_KEY` never sent to browser
- Audit log fields: `admin_user_id`, `action`, `target_user_id`, `payload`, `created_at`
- Community moderators (`is_community_moderator`) are **not** admins — billing changes never available to moderators

---

## Routes

| Route | Phase | Purpose |
|-------|-------|---------|
| `/admin` | A ✅ | Overview KPIs |
| `/admin/users` | A ✅ | Searchable user table |
| `/admin/users/[id]` | A ✅ | Detail + comp actions |
| `/admin/audit` | A ✅ | Admin action log |
| `/admin/revenue` | B | MRR, ARR, churn, tier mix |
| `/admin/growth` | C | Funnels, activation, sources |
| `/admin/community` | C | Community ops metrics |
