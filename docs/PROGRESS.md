# forgeFit Build Progress Log

> **AI session handoff file.** Updated after every meaningful change.
> New sessions: read this + `docs/BIBLE.md` before coding.

---

## Current Status

| Field | Value |
|-------|-------|
| **Active phase** | Phase 6 complete → Phase 7 (Pro Integrations) next |
| **Last updated** | 2026-06-09 |
| **Last session focus** | RIR-based load progression |

---

## Phase Completion

| Phase | Name | Status | Completed |
|-------|------|--------|-----------|
| 0 | Scaffold | ✅ Complete | 2026-06-08 |
| 1 | Auth + Onboarding | ✅ Complete | 2026-06-08 |
| 2 | Evidence Engine | ✅ Complete | 2026-06-08 |
| 3 | Workout + Offline PWA | ✅ Complete | 2026-06-08 |
| 4 | Nutrition | ✅ Complete | 2026-06-08 |
| 5 | Measurements + Projections | ✅ Complete | 2026-06-08 |
| 6 | Exercise Library UI | ✅ Complete | 2026-06-08 |
| 7 | Pro Integrations | ⏳ Pending | — |
| 8 | Motivation + Gamification | ⏳ Pending | — |

---

## Session Log

### 2026-06-09 — RIR-based load progression

**What was done:**
- `lib/progression/rir-progression.ts` — analyzes logged RIR/effort and history to suggest weight, reps, and extra sets
- On workout start: prefills sets from last session + autoregulated bump; muscle-group carryover (+1 rep) when related work runs easy
- Active workout UI: progression notes, extra set count, "suggested" labels on prefilled fields
- Evidence rule: `rir_autoregulation`

**Logic summary:**
- Easy (RIR ≥ 3): +2.5% weight (beginner) or +5% (intermediate/advanced); bodyweight → +1 rep
- Two consecutive easy sessions: +1 working set (max 1 extra)
- Good (RIR ~2): hold load
- Hard (RIR 0): hold or −5% weight suggestion
- Muscle group: 4+ easy sets for same primary muscle → +1 rep target on related exercises

**Files touched:**
- `apps/web/src/lib/progression/rir-progression.ts`, `load-progression-types.ts`
- `packages/offline-sync/src/workout-store.ts`, `types.ts`
- `apps/web/src/components/workout/workout-hub.tsx`, `active-workout.tsx`, `set-row.tsx`
- `apps/web/src/app/(app)/workout/page.tsx`
- `packages/evidence-kb/src/rules-extra.ts`
- `docs/PROGRESS.md`

---

### 2026-06-09 — Adherence-based experience promotion

**What was done:**
- `lib/progression/` — weekly adherence scoring, promotion gates (beginner→intermediate, intermediate→advanced)
- Migration: `experience_promoted_at`, `promotion_snoozed_until` on `profiles`
- `acceptExperiencePromotion` / `snoozeExperiencePromotion` server actions → updates level + regenerates program
- Home / Workout / Profile UI: gold promotion banner when eligible; consistency progress card otherwise
- Evidence rules: `experience_promotion_beginner`, `experience_promotion_intermediate`

**Promotion gates:**
- Beginner → Intermediate: 3 of last 4 weeks ≥75% planned sessions + 10 quality sessions (≥50% sets logged)
- Intermediate → Advanced: 6 of last 8 weeks ≥80% + 28 quality sessions (≥60% sets logged)

**What's next:**
- Apply `20260608600000_experience_promotion.sql` migration
- Phase 7: Stripe + device OAuth

**Files touched:**
- `supabase/migrations/20260608600000_experience_promotion.sql`
- `apps/web/src/lib/progression/*`
- `apps/web/src/app/actions/progression.ts`
- `apps/web/src/components/progression/*`
- `apps/web/src/lib/home/service.ts`, `home/page.tsx`
- `apps/web/src/app/(app)/workout/page.tsx`, `workout-hub.tsx`
- `apps/web/src/app/(app)/profile/page.tsx`
- `packages/evidence-kb/src/rules-extra.ts`
- `docs/BIBLE.md`, `docs/PROGRESS.md`

---

### 2026-06-09 — Evidence transparency + recovery equipment

**What was done:**
- Expanded `RECOVERY_EQUIPMENT` (cold plunge, cryotherapy, red light, active recovery, etc.) and wired all options into `buildRecoveryBlock`
- Fixed caliper formula/sex pickers (segmented buttons instead of broken native `<select>` on iOS)
- Added `/evidence` page with browsable rule cards: recommendations, confidence, applies-when tags, and cited sources (DOI/URL)
- Contextual “View evidence” links on Workout, Nutrition macros, Progress projection, and Profile
- Presentation layer: `lib/evidence/present.ts`, `getRulesByIds()` in evidence-kb

**What's next:**
- Profile editor for recovery equipment (onboarding-only today)
- Phase 7: Stripe + device OAuth

**Files touched:**
- `apps/web/src/lib/constants/onboarding.ts`
- `apps/web/src/lib/evidence/*`
- `apps/web/src/components/evidence/*`
- `apps/web/src/app/(app)/evidence/page.tsx`
- `apps/web/src/components/nutrition/macro-summary.tsx`
- `apps/web/src/components/workout/workout-hub.tsx`
- `apps/web/src/components/progress/*`
- `apps/web/src/app/(app)/profile/page.tsx`
- `packages/program-engine/src/generate.ts`
- `packages/evidence-kb/src/rules-extra.ts`, `index.ts`
- `docs/PROGRESS.md`

---

### 2026-06-08 — Phase 6 complete (Exercise library UI)

**What was done:**
- Imported 873 exercises from `free-exercise-db` into `packages/exercise-db/data/catalog.json`
- `searchCatalog`, `resolveExerciseDetail`, `getSubstitutions` + curated program id aliases
- `/exercises` search/browse, `/exercises/[id]` detail with frame animation + muscle heatmap
- `react-body-highlighter` muscle map, equipment swap preview vs user inventory
- Active workout exercise names link to library; SW caches GitHub demo images offline

**What's next:**
- Phase 7: Stripe + device OAuth (Withings, Fitbit, Strava)

**Files touched:**
- `packages/exercise-db/` (catalog, resolve, substitutions, build script)
- `apps/web/src/app/(app)/exercises/`, `components/exercises/`, `lib/exercises/`
- `apps/web/next.config.ts`, `apps/web/src/app/sw.ts`, docs

---

### 2026-06-08 — Phase 5 complete (Measurements + projections)

**What was done:**
- `@forgefit/projection-engine` — Jackson-Pollock 3/7-site caliper math, evidence-capped `projectWeight()`, trend series builder
- Migration `20260608400000_phase5_measurements.sql` — `body_measurements`, `caliper_measurements`, `projections` + RLS
- APIs: `POST /api/measurements`, `POST /api/measurements/caliper`
- Progress tab: Recharts trend chart, 30-day projection, log form, caliper calculator
- Onboarding profile used as chart baseline when no logs exist yet

**What's next:**
- Phase 6: exercise library UI (GIFs, muscle maps)
- Apply Phase 5 migration: `supabase db push`

**Files touched:**
- `packages/projection-engine/`, `supabase/migrations/20260608400000_phase5_measurements.sql`
- `apps/web/src/lib/measurements/`, `apps/web/src/app/api/measurements/`
- `apps/web/src/components/progress/`, `apps/web/src/app/(app)/progress/page.tsx`
- `apps/web/package.json`, `apps/web/next.config.ts`, docs

---

### 2026-06-08 — Phase 4 complete (Nutrition diary)

**What was done:**
- `@forgefit/nutrition-core` — USDA + Open Food Facts parallel search, macro scaling
- Migration `20260608300000_phase4_nutrition.sql` — `nutrition_logs` table + RLS
- APIs: `GET /api/nutrition/search`, `GET/POST /api/nutrition/logs`, `DELETE /api/nutrition/logs/[id]`
- Nutrition tab: macro progress vs program targets, food search, daily log list
- Optional `USDA_FDC_API_KEY` for branded US foods (OFF works without key)

**What's next:**
- Phase 5: body measurements, calipers, projection charts
- Apply Phase 4 migration: `supabase db push`

**Files touched:**
- `packages/nutrition-core/`, `supabase/migrations/20260608300000_phase4_nutrition.sql`
- `apps/web/src/app/api/nutrition/`, `lib/nutrition/`, `components/nutrition/`
- `apps/web/src/app/(app)/nutrition/page.tsx`, docs, `.env.example`, `README.md`

---

### 2026-06-08 — Finish workout button fix

**What was done:**
- Finish navigates back immediately after local save; sync runs in background
- Fixed router.refresh re-opening active workout from URL during sync
- Added saving state, error message, fetch timeout for sync

**Files touched:**
- `apps/web/src/components/workout/active-workout.tsx`, `workout-hub.tsx`
- `packages/offline-sync/src/sync-client.ts`, `docs/PROGRESS.md`

---

### 2026-06-08 — Offline workout sync fix

**What was done:**
- Aggressive sync on online/focus/visibility/pageshow + 15s retry when pending
- Sync error banner with retry; no more silent failures
- Finish workout always triggers sync; completing marks all sets unsynced
- Recent workouts list on Workout tab (proves cross-device sync)
- POST `/api/sync` bypasses service worker cache

**Blockers:**
- Phase 3 migration must be applied or sync returns 500 with clear error

**Files touched:**
- `packages/offline-sync/src/sync-client.ts`, `workout-store.ts`
- `apps/web/src/hooks/use-workout-sync.ts`, sync components, `api/sync/route.ts`
- `apps/web/src/lib/workouts/history.ts`, `workout-history.tsx`, `docs/PROGRESS.md`

---

### 2026-06-08 — Mobile workout set logging UX

**What was done:**
- Replaced cramped 5-column grid with stacked set cards (weight + reps side by side)
- Replaced RIR jargon with optional "How hard was it?" chips: Easy / Good / Hard
- Added back link and tighter mobile padding on active workout screen

**Files touched:**
- `apps/web/src/components/workout/set-row.tsx`, `active-workout.tsx`, `docs/PROGRESS.md`

---

### 2026-06-08 — Offline Turbopack chunk load fix

**What was done:**
- Workout open/resume uses React state + `history.replaceState` (avoids Next.js router fetching lazy chunks offline)
- SW prioritizes `/_next/static/` and turbopack assets with CacheFirst (256 entries)
- `PrefetchAppShell` warms tab routes in SW cache while online

**Files touched:**
- `apps/web/src/components/workout/workout-hub.tsx`, `active-workout.tsx`
- `apps/web/src/components/offline/prefetch-app-shell.tsx`, `apps/web/src/app/sw.ts`
- `apps/web/src/app/(app)/layout.tsx`, `docs/PROGRESS.md`

---

### 2026-06-08 — Phase 3 complete

**What was done:**
- `@forgefit/offline-sync` — Dexie store for sessions/sets, sync client
- Migration `20260608200000_phase3_workouts.sql` — `workout_sessions`, `exercise_sets` + RLS
- `POST /api/sync` — idempotent upsert by `client_id`
- Active workout UI at `/workout/[clientId]` — sets/reps/RIR logging, rest timer
- Serwist PWA via `@serwist/turbopack` — SW at `/serwist/sw.js`, offline fallback `/~offline`
- `SyncManager` auto-syncs on load and reconnect

**What's next:**
- Phase 4: nutrition diary (USDA + Open Food Facts)
- Apply Phase 3 migration: `supabase db push`

**Blockers:**
- User must apply `20260608200000_phase3_workouts.sql` before server-side workout history persists

**Files touched:**
- `packages/offline-sync/`, `supabase/migrations/20260608200000_phase3_workouts.sql`
- `apps/web/src/app/api/sync/route.ts`, `apps/web/src/app/(app)/workout/`
- `apps/web/src/components/workout/`, `apps/web/src/app/sw.ts`, `apps/web/src/app/serwist/`
- `apps/web/next.config.ts`, `apps/web/package.json`, docs

---

### 2026-06-08 — Auth routes no longer blocked by onboarding

**What was done:**
- `/login` and `/signup` always reachable (even with a partial session)
- Landing page only auto-redirects when onboarding is already complete
- Login page shows “already signed in” panel with sign-out option for stuck sessions

**Files touched:**
- `apps/web/src/lib/supabase/middleware.ts`, `apps/web/src/app/page.tsx`
- `apps/web/src/app/login/page.tsx`, `apps/web/src/components/auth/already-signed-in.tsx`
- `apps/web/src/components/auth/sign-out-button.tsx`, `docs/PROGRESS.md`

---

### 2026-06-08 — Sign In / Get Started routing fix

**What was done:**
- Logged-in users visiting `/`, `/login`, or `/signup` now redirect to `/home` or `/onboarding` (not a shared marketing page)
- OAuth callback routes by onboarding status instead of always sending users to onboarding
- Landing page is a server component; Sign In uses distinct styling from Get Started

**Files touched:**
- `apps/web/src/app/page.tsx`, `apps/web/src/lib/auth/post-auth-path.ts`
- `apps/web/src/lib/supabase/middleware.ts`, `apps/web/src/app/auth/callback/route.ts`
- `apps/web/src/components/auth/auth-form.tsx`, `docs/PROGRESS.md`

---

### 2026-06-08 — Phase 2 complete

**What was done:**
- Expanded `@forgefit/evidence-kb` to 30 rules with `matchRules()` and `getRecommendationValue()`
- Added `@forgefit/exercise-db` seed library (~28 exercises) with equipment-aware `pickExerciseForPattern()`
- Built `@forgefit/program-engine` — goal splits, volume scaling, nutrition targets, recovery blocks
- Migration `20260608180000_phase2_programs.sql` — `programs` table with JSONB plan + RLS
- `POST /api/programs/generate`, `generateAndSaveProgram` on onboarding + `ensureActiveProgram` on home
- Home dashboard `WeekSchedule` shows weekly sessions and macro targets
- Fixed `splits.ts` MovementPattern typing; `pnpm turbo typecheck build` passes

**What's next:**
- Phase 3: active workout UI, Serwist PWA, Dexie offline sync
- Apply Phase 2 migration if not yet run: `supabase db push` or SQL editor

**Blockers:**
- User must apply `20260608180000_phase2_programs.sql` before programs persist

**Files touched:**
- `packages/evidence-kb/`, `packages/exercise-db/`, `packages/program-engine/`
- `supabase/migrations/20260608180000_phase2_programs.sql`
- `apps/web/src/lib/programs/service.ts`, `apps/web/src/app/api/programs/generate/route.ts`
- `apps/web/src/app/actions/onboarding.ts`, `apps/web/src/app/(app)/home/page.tsx`
- `apps/web/src/components/program/week-schedule.tsx`, `apps/web/next.config.ts`, `apps/web/package.json`
- `docs/PROGRESS.md`, `docs/BIBLE.md`, `docs/ARCHITECTURE.md`, `docs/phases/02-evidence-engine.md`, `README.md`

---

### 2026-06-08 — Imperial weight input fix

**What was done:**
- Removed mid-typing rounding on lbs↔kg conversion (was turning 25 into 24.9)
- Local text buffer while typing so display is not rewritten each keystroke
- Removed HTML `min` on imperial weight that blocked low values while typing

**Files touched:**
- `apps/web/src/lib/units/measurements.ts`
- `apps/web/src/components/onboarding/measurement-step.tsx`
- `apps/web/src/components/onboarding/use-unit-input.ts`
- `apps/web/src/app/(app)/profile/page.tsx`

---

### 2026-06-08 — CI pnpm version fix

**What was done:**
- Removed duplicate `version: 9` from `.github/workflows/ci.yml`
- CI now uses `packageManager: pnpm@9.15.0` from root `package.json` only

**Files touched:**
- `.github/workflows/ci.yml`, `docs/PROGRESS.md`

---

### 2026-06-08 — Onboarding unit system tiles

**What was done:**
- Replaced per-field dropdowns with one tile row: Metric (cm/kg) vs Imperial (ft/in/lbs)
- All measurement inputs switch units together from that selection
- Still stores kg/cm in database with behind-the-scenes conversion

**Files touched:**
- `apps/web/src/lib/units/measurements.ts`
- `apps/web/src/components/onboarding/measurement-step.tsx`
- `docs/DESIGN.md`, `docs/PROGRESS.md`

---

### 2026-06-08 — Phase 1 complete

**What was done:**
- Added Supabase migration: `profiles`, `equipment_inventory`, `recovery_equipment`, RLS, triggers
- Wired Supabase Auth (email + Google OAuth) with middleware session refresh
- Built login/signup pages and OAuth callback route
- Built 7-step onboarding wizard with server action persistence
- Added app shell with bottom nav (Home, Workout, Nutrition, Progress, Profile)
- Added placeholder pages for Workout/Nutrition/Progress; profile with sign-out
- Added `docs/supabase-setup.md` for developer onboarding
- CI build uses placeholder Supabase env vars

**What's next (Phase 2):**
- Create `packages/program-engine`
- Expand evidence-kb to 30 rules
- `/api/programs/generate` endpoint
- Dashboard week schedule from generated program

**Blockers:** User must configure Supabase credentials locally (see `docs/supabase-setup.md`)

**Files touched:**
- `supabase/migrations/20260608160000_phase1_profiles_onboarding.sql`
- `apps/web/src/lib/supabase/*`, `middleware.ts`
- `apps/web/src/app/login`, `signup`, `onboarding`, `auth/callback`
- `apps/web/src/app/(app)/*`
- `apps/web/src/components/auth/*`, `onboarding/*`, `layout/*`
- `apps/web/src/app/actions/onboarding.ts`
- `docs/supabase-setup.md`, `docs/phases/01-onboarding.md`
- `docs/PROGRESS.md`, `docs/BIBLE.md`, `docs/ARCHITECTURE.md`, `README.md`

---

### 2026-06-08 — Logo SVG + initial commit

**What was done:**
- Converted logo concept to high-resolution SVG (`logo.svg`, `logo-icon.svg`)
- Stored reference PNG in `docs/assets/logo-concept-reference.png`
- Integrated logo on landing page, favicon, and PWA manifest
- Updated `docs/DESIGN.md` with logo asset table

---

### 2026-06-08 — Phase 0 complete

**What was done:**
- Created `docs/BIBLE.md`, `PROGRESS.md`, Cursor rules
- Scaffolded Turborepo, Next.js 15, Forge Ember tokens, evidence-kb seed
- CI pipeline, README, phase docs

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-06-08 | Freemium model ($12.99/mo Pro) | Defer expensive APIs to paid tier |
| 2026-06-08 | "Forge Ember" color scheme | Warm encouragement, dark-first for gym |
| 2026-06-08 | Bible + PROGRESS sync rule | Keep AI sessions and docs aligned |
| 2026-06-08 | Supabase `@supabase/ssr` | Cookie-based auth for Next.js App Router |
