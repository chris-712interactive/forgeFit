# forgeFit Architecture

> Developer reference. Authoritative plan: [BIBLE.md](./BIBLE.md) · Build log: [PROGRESS.md](./PROGRESS.md)

## Overview

forgeFit is a **mobile-first Next.js PWA** in a **Turborepo monorepo**, backed by **Supabase**, with deterministic fitness logic in shared packages (not LLMs).

```
apps/web          → Next.js 15 UI + API route handlers
packages/ui       → Forge Ember design tokens
packages/evidence-kb → 30 peer-reviewed rules + citations
packages/exercise-db → Seed exercise library + equipment tags
packages/program-engine → Goal splits, volume, nutrition targets
packages/offline-sync   → Dexie workout store + sync client
packages/nutrition-core → USDA/OFF food search + macro helpers
packages/projection-engine → Jackson-Pollock calipers + weight projections
supabase/         → PostgreSQL migrations + RLS
```

## Package Boundaries

| Package | Responsibility | Phase |
|---------|----------------|-------|
| `@forgefit/ui` | CSS tokens, shared components | 0 |
| `apps/web` auth + onboarding | Supabase Auth, dynamic onboarding wizard (sport + age gates), bottom nav | 1, 9 |
| `@forgefit/evidence-kb` | Citable fitness/nutrition rules, **US sport catalog** | 0–2, 9 |
| `@forgefit/program-engine` | Goal templates, volume, scheduling, **age policy** | 2, 9 |
| `@forgefit/projection-engine` | Weight/strength forecasts | 5 |
| `@forgefit/exercise-db` | 873-exercise catalog, demos, substitutions | 2, 6 |
| `@forgefit/nutrition-core` | USDA/OFF diary | 4 |
| `@forgefit/projection-engine` | Caliper BF%, weight trends, 30-day forecasts | 5 |
| `@forgefit/integrations` | OAuth device adapters | 7 |
| `@forgefit/coaching` | Pre-workout hype, PR copy, habit scoring | 8 |
| `@forgefit/offline-sync` | Dexie sessions/sets + `/api/sync` client | 3 |

## Data Flow

1. User completes onboarding → `profiles` + equipment + goals (+ sport fields, parent consent if 13–15) in Supabase
2. `program-engine` reads `evidence-kb` + profile → `ProgramPlan` JSON stored in `programs`
3. Workout UI writes `exercise_sets` to Dexie offline → syncs to Supabase on reconnect
4. `projection-engine` reads measurement history → `projections` table
5. `coaching` package triggers messages on milestones (Phase 8)

## Auth Flow (Phase 1)

1. User signs up via `/signup` (email or Google OAuth)
2. `handle_new_user` trigger creates `profiles` row
3. Middleware redirects incomplete profiles to `/onboarding`
4. `completeOnboarding` server action saves profile + equipment + generates program
5. User lands on `/home` with week schedule and macro targets

## Admin Console (Phases A–D shipped — 2026-07-06)

Internal operator UI at `/admin` (desktop-first, separate from member PWA shell).

**Operator login:** `/admin/login` (not member `/login`). **View as user:** read-only impersonation from user detail — admin session stays active.

**Full plan:** [ADRs/002-forgerep-admin-console.md](./ADRs/002-forgerep-admin-console.md) · **Acceptance criteria:** [phases/admin-console.md](./phases/admin-console.md) · **UI mockup:** `apps/web/content/admin/console-mockup.html`

| Piece | Location |
|-------|----------|
| Access control | `lib/admin/auth.ts` — `ADMIN_USER_IDS` + `profiles.is_admin` |
| Operator login | `app/admin/login` — separate from `app/login` |
| Impersonation | `lib/admin/impersonation.ts`, `lib/auth/member-context.ts` |
| Comp billing | `lib/admin/comp.ts` — grant/revoke without Stripe charge |
| Overview KPIs | `lib/admin/metrics.ts`, `stripe-metrics.ts` |
| Revenue dashboard | `app/admin/(authenticated)/revenue`, `revenue-metrics.ts` |
| Growth dashboard | `app/admin/(authenticated)/growth`, `growth-metrics.ts` |
| Community ops | `app/admin/(authenticated)/community` |
| Broadcast | `app/admin/(authenticated)/broadcast`, `lib/admin/broadcast.ts` |
| Ingredients review | `app/admin/(authenticated)/ingredients` |
| Admin operators | `app/admin/(authenticated)/admins` |
| Feature flags | `profiles.admin_feature_flags`, user detail form; wired into `hasFeature()` via `getSubscriptionForUser()` |
| Billing actions | user detail — cancel/refund via `lib/admin/billing-actions.ts` |
| CSV export | `GET /api/admin/export/subscriptions`, `.../users` |
| Audit trail | `admin_audit_log` + `lib/admin/audit.ts` |

Requires `SUPABASE_SERVICE_ROLE_KEY`. Impersonation signing uses `ADMIN_IMPERSONATION_SECRET` or `CRON_SECRET`. Broadcast email needs `RESEND_API_KEY` + `EMAIL_FROM`; push needs VAPID keys. Non-admins receive **404** (not 403).

## Program Generation (Phase 2)

1. `generateProgram()` in `@forgefit/program-engine` reads profile + `evidence-kb` rules
2. Equipment inventory filters `@forgefit/exercise-db` picks per movement pattern
3. Goal-based functional bias ranks free-weight compounds ahead of machines; bodybuilding keeps a compound floor per session while strength goals prioritize transferable patterns (including carries)
4. Regeneration accepts an optional **schedule start date** (`scheduleStartDate` on `ProgramPlan`) from profile plan settings, equipment changes, travel mode, and experience promotions; workouts stay locked until that calendar day
5. Goal-based weekly split scaled by sessions/week and minutes/session
6. Nutrition targets (Mifflin-St Jeor + protein/fat/carbs from matched rules)
7. `ProgramPlan` JSON stored in `programs.plan` with `appliedRuleIds` for traceability
8. `ensureActiveProgram()` auto-generates on first `/home` visit if none exists

## Workout Tracking (Phase 3)

1. User starts a session from `/workout` → `startWorkoutSession()` writes to Dexie (IndexedDB)
2. Active workout at `/workout/[clientId]` logs sets/reps/RIR per exercise
3. Rest timer auto-starts after each completed set (program `restSeconds`); deadline-based countdown reconciles on app resume (Phase 12)
4. `SyncManager` in app layout calls `syncWorkoutData()` on load and `online` event
5. `POST /api/sync` upserts `workout_sessions` + `exercise_sets` by `client_id`
6. **Schedule adjuster** — per-week overrides in Dexie + `workout_schedule_overrides`; `Move` on each day card opens a week picker; occupied days auto-swap; `GET/POST /api/workout-schedule` syncs overrides
7. **Custom workouts (Phase 11, Pro)** — builder on Workout hub; `session_source` + `day_index = -1`; equipment-filtered exercise picker; optional warmup; templates in `user_workout_templates`; native CSV import (`workout_import`) and export (`data_export`)
8. **Interval protocols (Phase 13, Pro)** — optional `intervalProtocol` on templates/sessions (`density` / `tabata` / `superset_block`); `IntervalTimer` with gym-loud GO/STOP cues + 3s countdown; CSV v2; Gravity Week 1 install pack on Workout hub
9. **Custom day assignments (Phase 11, Pro)** — assign templates to calendar dates; Replace vs Keep both when a day already has a program/custom; hub merges assigned cards into “This week”
10. Serwist service worker at `/serwist/sw.js` precaches shell + workout routes

## Nutrition Diary (Phase 4)

1. Active program `nutrition` targets shown on Nutrition tab (from `program-engine`)
2. `GET /api/nutrition/search` queries USDA (optional API key) + Open Food Facts in parallel
3. User taps a result → `POST /api/nutrition/logs` stores scaled macros in `nutrition_logs`
4. Daily totals computed with `sumMacros()` and compared to targets in `MacroSummary`

## Exercise Library (Phase 6)

1. Catalog built from open `free-exercise-db` dataset (873 exercises, dual-frame demos)
2. `/exercises` searches `@forgefit/exercise-db` by name, pattern, muscle
3. `/exercises/[id]` resolves curated program ids → catalog aliases for demos
4. `getSubstitutions()` ranks same-pattern exercises by muscle overlap + user equipment; optional `excludeEquipment` for in-session "equipment busy" swaps
5. Active workout: **Equipment busy?** bottom sheet → `swapExerciseInSession()` updates remaining sets offline-first; syncs `planned_exercise_id` to Supabase
6. `react-body-highlighter` renders muscle activation from `highlightMuscles`
7. Serwist caches GitHub-hosted demo frames for offline viewing

## Measurements + Projections (Phase 5)

1. Progress tab loads `body_measurements` history (falls back to onboarding profile baseline)
2. `POST /api/measurements` upserts daily weight/circumference; updates `profiles.weight_kg`
3. `POST /api/measurements/caliper` runs Jackson-Pollock 3/7-site via `@forgefit/projection-engine`
4. `projectWeight()` blends logged trend with evidence-capped goal rate → 30-day chart
5. Projection JSON cached in `projections` table for fast reload

## Partner Attribution (Phase 14)

First-party **Partner** subsystem for gyms (e.g. EoS), influencers, and affiliates — not a third-party network at launch.

**ADR:** [ADRs/003-partner-attribution-revshare.md](./ADRs/003-partner-attribution-revshare.md) · **Acceptance:** [phases/14-partner-attribution.md](./phases/14-partner-attribution.md)

**Phase 14A–14C shipped in code** — apply `20260720150000_partner_attribution.sql`, `20260720160000_partner_commissions.sql`, and `20260720170000_partner_portal_commercial.sql`. Enable Stripe webhook events `invoice.paid` and `charge.refunded`.

```
/r/[slug] → cookie + attribution_events → user_attributions on signup/claim
    → Stripe Checkout metadata (partner_id, attribution_id)
    → invoice.paid → partner_commissions ledger
    → Admin /admin/partners (CRUD + ledger + CSV + mark paid + portal grant + W-9)
    → Partner portal /partner (read-only)
```

| Concept | Notes |
|---------|--------|
| `partners` + `partner_deals` | Typed partners; versioned % / CPA / windows; `duration_months` null = life of subscription |
| Commercial defaults | Net-30, $50 min payout, W-9 required before Mark paid |
| Self-referral | Blocked when member email = partner contact or portal user |
| Commission base | Per deal: `gross`, `net_of_fees`, `net_of_fees_and_tax` |
| Click windows | Influencer/affiliate 30d · gym 90d (templates; overridable) |
| vs `profiles.signup_source` | Prior app from onboarding — **not** acquisition partner |
| Default attribution | First durable touch |
| Portal | `partner_portal_users` + `/partner/login` |

Does not change program-engine / evidence-kb boundaries.

## API Surface

| Route | Purpose | Phase |
|-------|---------|-------|
| `/auth/callback` | OAuth code exchange | 1 |
| Server action `completeOnboarding` | Save onboarding | 1 |
| `/api/sync` | Offline batch upload | 3 |
| `/api/workout-schedule` | Per-week workout date overrides | 3+ |
| `/api/workouts/import` | Native ForgeRep workout template CSV (Pro) | 11 |
| `/api/workouts/export` | Completed workout CSV export (Pro) | 11 |
| `/api/workout-templates` | Saved custom workout templates (Pro) | 11 |
| `/api/programs/generate` | Create program from profile | 2 |
| `/api/nutrition/search` | Food lookup | 4 |
| `/api/measurements` | Log body measurements | 5 |
| `/api/measurements/caliper` | Jackson-Pollock BF% | 5 |
| `/api/integrations/*` | OAuth callbacks | 7 |
| `/r/[slug]` | Partner tracked redirect + cookie | 14A |
| `/api/partners/claim` | Stamp attribution onto current user | 14A |
| `/api/admin/partners` | Admin partner CRUD | 14A |
| `/api/admin/partners/ledger` | Commission ledger + mark payout paid | 14B |
| `/api/admin/export/partner-commissions` | Partner summary/detail CSV | 14B |
| `/partner/login` | Partner portal sign-in | 14C |
| `/partner` | Partner read-only dashboard | 14C |

## Security

- Supabase Row Level Security on all user tables
- OAuth tokens encrypted at rest
- No program logic in LLM prompts

## Documentation Sync

Every change must update [PROGRESS.md](./PROGRESS.md). See `.cursor/rules/documentation-sync.mdc`.
