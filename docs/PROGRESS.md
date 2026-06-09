# forgeFit Build Progress Log

> **AI session handoff file.** Updated after every meaningful change.
> New sessions: read this + `docs/BIBLE.md` before coding.

---

## Current Status

| Field | Value |
|-------|-------|
| **Active phase** | Phase 3 complete → Phase 4 (Nutrition) next |
| **Last updated** | 2026-06-08 |
| **Last session focus** | Offline workout navigation + program cache |

---

## Phase Completion

| Phase | Name | Status | Completed |
|-------|------|--------|-----------|
| 0 | Scaffold | ✅ Complete | 2026-06-08 |
| 1 | Auth + Onboarding | ✅ Complete | 2026-06-08 |
| 2 | Evidence Engine | ✅ Complete | 2026-06-08 |
| 3 | Workout + Offline PWA | ✅ Complete | 2026-06-08 |
| 4 | Nutrition | ⏳ Pending | — |
| 5 | Measurements + Projections | ⏳ Pending | — |
| 6 | Exercise Library UI | ⏳ Pending | — |
| 7 | Pro Integrations | ⏳ Pending | — |
| 8 | Motivation + Gamification | ⏳ Pending | — |

---

## Session Log

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
