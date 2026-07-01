# forgeFit Build Progress Log

> **AI session handoff file.** Updated after every meaningful change.
> New sessions: read this + `docs/BIBLE.md` before coding.

---

## Current Status

| Field | Value |
|-------|-------|
| **Active phase** | Phase 9 in progress (9A–9I shipped) |
| **Last updated** | 2026-07-01 |
| **Last session focus** | Community PR weight units (imperial display) |

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
| 7 | Pro Integrations | ⏳ Partial | — |
| 8 | Motivation + Gamification | ✅ Complete | 2026-06-12 |
| 9 | Youth & Sport Performance | ⏳ In progress (9A–9I shipped) |
| — | Community expansion (Phases 1–7) | ✅ Complete | 2026-06 |

---

## Session Log

### 2026-07-01 — Fix completed workout still showing Start button

**What was done:**
- Fixed week plan cards showing **Start** after logging a workout when completion fell on a different calendar day than the scheduled slot (e.g. Tuesday session finished Wednesday) or when UTC timestamps crossed midnight vs local time
- `sessionMatchesScheduledPlanDay` now matches by plan-week bounds + `dayIndex` instead of exact calendar-date equality
- `sessionDateIso` uses local calendar dates (`toScheduleStartIso`) for consistency

**What's next:**
- Manual QA: log a past-day slot workout and confirm card switches to **Results**

**Blockers:** None

**Files touched:**
- `apps/web/src/lib/workouts/schedule-dates.ts`
- `apps/web/src/lib/workouts/sessions.test.ts`
- `docs/PROGRESS.md`

### 2026-07-01 — Per-dumbbell weight hint in workout logger

**What was done:**
- Added `exerciseLogsPerDumbbell()` in `@forgefit/exercise-db` to detect dumbbell lifts where logged weight is one bell (each hand), excluding goblet-style single-implement holds and barbell-primary dual-modality lifts
- Workout set row shows `· per dumbbell` next to the weight label for those exercises

**What's next:**
- Consider the same hint on profile 1RM fields if dumbbell-specific maxes are added later

**Blockers:** None

**Files touched:**
- `packages/exercise-db/src/tracking.ts`
- `packages/exercise-db/src/index.ts`
- `apps/web/src/components/workout/set-row.tsx`
- `docs/PROGRESS.md`

### 2026-06-30 — Profile program section redesign

**What was done:**
- Split “Program & equipment” into separate collapsible sections with summary hints (e.g. `Football · 3×45 min`)
- Program plan uses nested sub-sections: Goal & time (open by default), Sport profile, Practice schedule, Body composition, Rebuild options
- Save / Rebuild actions stay visible without expanding rebuild options
- Equipment split into Training gear, Recovery tools, Save options + always-visible save bar

**Files touched:**
- `apps/web/src/components/profile/profile-subsection.tsx` (new)
- `apps/web/src/components/profile/program-plan-setting.tsx`
- `apps/web/src/components/profile/sport-plan-fields.tsx`
- `apps/web/src/components/profile/equipment-setting.tsx`
- `apps/web/src/components/profile/profile-settings-hub.tsx`
- `apps/web/src/lib/profile/plan-hints.ts` (new)
- `docs/PROGRESS.md`

### 2026-06-30 — Sport practice days + schedule blocking (9I)

**What was done:**
- Migration: `sport_practice_days`, `sport_practice_gym_policy`, `sport_practice_schedule_varies` on profiles
- Onboarding step after season timing: practice weekdays, “varies week to week”, gym-on-practice policy (default avoid in-season)
- Profile → Program plan: edit practice schedule; regenerate respects blocked days
- Engine: `assignSessionWeekdays` deprioritizes practice days when policy is `avoid`; falls back if not enough open days

**What's next:** Apply migration `#47` on hosted Supabase; manual QA sport onboarding + profile regenerate

**Files touched:**
- `supabase/migrations/20260630130000_sport_practice_schedule.sql`
- `packages/program-engine/src/schedule.ts`, `sport/practice-schedule.ts`, `generate.ts`, tests
- `apps/web/src/lib/types/profile.ts`, `lib/onboarding/steps.ts`, `lib/onboarding/sport-practice.ts`
- `apps/web/src/components/onboarding/sport-steps.tsx`, `onboarding-wizard.tsx`
- `apps/web/src/components/profile/sport-plan-fields.tsx`, `program-plan-setting.tsx`
- `apps/web/src/app/actions/onboarding.ts`, `actions/program.ts`
- `apps/web/src/lib/programs/service.ts`
- `docs/phases/09-youth-sport.md`, `docs/supabase-setup.md`, `docs/PROGRESS.md`

### 2026-06-30 — Workout phase card flip preview

**What was done:**
- Phase bars (warm-up / workout / recovery) flip on tap to preview planned activities without starting the workout
- Warm-up: movement list + prescriptions · Workout: exercises with sets×reps · Recovery: equipment + guidance steps

**What's next:** —

**Blockers:** None

**Files touched:** `apps/web/src/components/workout/workout-phase-cards.tsx`, `docs/PROGRESS.md`

### 2026-06-30 — Competitive cheer evidence + Vercel build fix

**What was done:**
- Fixed Vercel build: `prefer-const` in `onboarding-wizard.tsx` (`let next` → `const next`)
- **Competitive cheer:** dedicated weekly split (Jump & Land, Stunt Prep, Core Stability, Power Maintenance)
- Catalog v1.1.0: base / flyer / tumbler positions with modifiers
- Added 4 evidence rules: stunting shoulder care, volume cap, in-season load, sport-specific protein (KB v0.5.1)
- Expanded `competitive_cheer_tumbling` with AAP injury-prevention citation and reps range

**What's next:** Wire scapular volume counts · migrate remaining hardcoded templates to KB · 9H catalog completion

**Blockers:** None

**Files touched:** `apps/web/src/components/onboarding/onboarding-wizard.tsx`, `packages/evidence-kb/data/sports-catalog.json`, `rules-sport-catalog.ts`, `packages/program-engine/src/sport/splits.ts`, `docs/PROGRESS.md`

### 2026-06-30 — Evidence KB gap audit + sport rule wiring

**What was done:**
- Audited sport-science calculations vs evidence KB: identified unwired rules, hardcoded splits, weak citations
- Added **23 rules** (KB v0.5.0): `rules-youth-policy.ts` (10 age/time/nutrition gates), `rules-sport-catalog.ts` (13 sport demand profiles for catalog sports without hardcoded templates)
- Strengthened citations in `rules-sport.ts` (NSCA youth RT, RED-S, FIFA 11+ meta-analysis DOIs)
- Wired engine: `priority_patterns` merge, sport-specific `reps_range`, neuromuscular ACL warmups from matched rules

**What's next:** Move `SPORT_TEMPLATES` + `POSITION_PATTERN_BOOSTS` into evidence-backed catalog rules · ADR for hardcoded split rationale · 9H remaining catalog sports · age-policy reads rule IDs for traceability

**Blockers:** None

**Files touched:** `packages/evidence-kb/src/rules-youth-policy.ts`, `rules-sport-catalog.ts`, `rules-sport.ts`, `index.ts`, `packages/program-engine/src/sport/patterns.ts`, `warmup.ts`, `generate.ts`, `docs/PROGRESS.md`

### 2026-06-30 — Phase 9C–9G: sport engine, evidence, teen community

**What was done:**
- **9C:** 16 sport/youth evidence rules (`rules-sport.ts`), extended `RuleContext` (age band, sport, season, secondary goal), KB v0.4.0
- **9D:** Sport splits for basketball, soccer, football, volleyball, baseball, softball, general athleticism + position modifiers
- **9E:** In-season volume caps, maintenance/off-season nutrition, hybrid secondary goal calories
- **9F:** Profile sport plan fields (sport, position, season, secondary goal) + `updatePlanSettings` validation
- **9G:** `bucket_age_cohort` migration, teen/adult leaderboard isolation, parent-consent gate on community opt-in

**What's next:** Apply migrations on hosted Supabase · 9H expand sport catalog · migrate hardcoded sport templates into evidence rules

**Blockers:** None

**Files touched:** `packages/evidence-kb/src/rules-sport.ts`, `packages/program-engine/src/sport/*`, `packages/program-engine/src/nutrition.ts`, `apps/web/src/components/profile/sport-plan-fields.tsx`, `apps/web/src/lib/coaching/community-bucket.ts`, `supabase/migrations/20260630120000_community_teen_cohort.sql`, docs

### 2026-06-30 — Phase 9A + 9B: youth sport onboarding

**What was done:**
- **`docs/phases/09-youth-sport.md`** — full phase plan (hybrid secondary goal, teen cohort preview, parent sign-off 13–15, US catalog)
- **9A:** `age-policy.ts` + tests, `sports-catalog.json` + loader, migrations `20260630110000_youth_sport_enum.sql` + `20260630110100_youth_sport_onboarding.sql`, `sport_performance` goal type
- **9B:** Dynamic onboarding wizard — sport path (all ages), optional secondary goal, parent consent step (13–15), age-gated physique goals and time budgets; server validation in `completeOnboarding`

**What's next:** Apply migration on hosted Supabase · 9C evidence rules · 9D sport-specific engine splits · 9G teen community cohort

**Blockers:** None

**Files touched:** `packages/program-engine/src/age-policy.ts`, `packages/evidence-kb/data/sports-catalog.json`, `packages/evidence-kb/src/sports-catalog.ts`, `apps/web/src/components/onboarding/*`, `apps/web/src/lib/onboarding/*`, `apps/web/src/app/actions/onboarding.ts`, `supabase/migrations/20260630110000_youth_sport_enum.sql`, `supabase/migrations/20260630110100_youth_sport_onboarding.sql`, `docs/phases/09-youth-sport.md`, `docs/BIBLE.md`, `docs/ARCHITECTURE.md`, `docs/PROGRESS.md`

### 2026-06-30 — Fix sport_performance enum migration split

**What was done:**
- Split youth sport migration into two files — PostgreSQL rejects using a new enum value in the same transaction that adds it
- `20260630110000_youth_sport_enum.sql` adds `sport_performance` only; `20260630110100_youth_sport_onboarding.sql` adds columns + check constraint

**What's next:** Re-run migrations on hosted Supabase (enum first, then columns)

**Blockers:** None

**Files touched:** `supabase/migrations/20260630110000_youth_sport_enum.sql`, `supabase/migrations/20260630110100_youth_sport_onboarding.sql`, `docs/PROGRESS.md`, `docs/phases/09-youth-sport.md`

### 2026-06-30 — 5-year business plan printable URL

**What was done:**
- Business plan served at **`/docs/business/5yr`** (noindex, same pattern as IG calendar)
- `generate-pdf.mjs` now writes `apps/web/content/business/5yr-print.html` for web + print bar
- `--html-only` flag skips Chrome PDF step when regenerating deploy HTML

**What's next:** Deploy · run full `generate-pdf.mjs` when PDF export needed

**Blockers:** None

**Files touched:** `docs/business/generate-pdf.mjs`, `docs/business/forgeRep-5-year-business-plan.md`, `apps/web/content/business/5yr-print.html`, `apps/web/src/app/docs/business/5yr/route.ts`, `docs/PROGRESS.md`

### 2026-06-30 — Instagram production specs (batch + audio + phone)

**What was done:**
- **Phone-first production guide** in calendar doc — batch clip names, audio codes, daily CapCut/Canva/IG workflow
- **Production table on all 31 days** — batch file, clips, audio (VO/CAP/TREND/BEAT/CAM), tool, time per piece
- Printable `/docs/marketing/ig31` updated with production legend page + per-day prod tables

**What's next:** Deploy · Batch Day 0 if not recorded

**Blockers:** None

**Files touched:** `docs/marketing/instagram-31-day-calendar.md`, `apps/web/content/marketing/ig31-print.html`, `docs/PROGRESS.md`

### 2026-06-30 — Instagram calendar printable URL

**What was done:**
- Printable calendar served at **`/docs/marketing/ig31`** (easy to type, not in sitemap)
- `noindex` via meta tag, `X-Robots-Tag` header, and `robots.txt` disallow `/docs/`
- Public route (no login) · source HTML: `apps/web/content/marketing/ig31-print.html`

**What's next:** —

**Blockers:** None

**Files touched:** `apps/web/src/app/docs/marketing/ig31/route.ts`, `apps/web/src/app/docs/layout.tsx`, `apps/web/content/marketing/ig31-print.html`, `apps/web/src/app/robots.ts`, `apps/web/src/lib/supabase/middleware.ts`, `docs/marketing/instagram-31-day-calendar.md`, `docs/PROGRESS.md`

### 2026-06-30 — Instagram calendar printable

**What was done:**
- Added `docs/marketing/instagram-31-day-calendar-printable.html` — print-optimized field guide (~8 pages): quick reference, batch mapping, all 31 days, hook bank, hashtags, checklists
- Linked from `instagram-31-day-calendar.md`

**What's next:** —

**Blockers:** None

**Files touched:** `docs/marketing/instagram-31-day-calendar-printable.html`, `docs/marketing/instagram-31-day-calendar.md`, `docs/PROGRESS.md`

### 2026-06-30 — MFP Q4 (switcher tools + Pro upgrade moments)

**What was done:**
- **MFP CSV import** — parser (`mfp-csv-parser.ts`), POST `/api/nutrition/import` (500 rows, 90-day lookback), Browse tab panel with GTM `forge_mfp_import_completed`
- **Selective barcode / Open Food Facts** — OFF lookup in `nutrition-core`, `/api/nutrition/barcode`, `?source=off` search, `PackagedFoodPanel` on Browse tab (barcode + OFF-only search)
- **Pro upgrade moments** — Home teaser for free users (`HomeProUpgradeTeaser`), nutrition adherence banner after 28+ logged days, stronger progress projection CTA when trend exists
- **`getDistinctNutritionLogDayCount()`** — powers adherence milestone banner on nutrition page

**What's next (from mfp-differentiation.md):**
- Q4 P1: Pro+ restaurant quick-log polish (saved meals, line items)
- Q4 P2: Landing hero refresh, onboarding drip
- MFP CSV import help article (support + SEO)
- Apply migration #46 on hosted Supabase if onboarding save fails

**Blockers:** None

**Files touched:**
- `apps/web/src/lib/nutrition/mfp-csv-parser.ts`, `mfp-csv-parser.test.ts`
- `apps/web/src/app/api/nutrition/import/route.ts`, `barcode/route.ts`, `search/route.ts`
- `packages/nutrition-core/src/open-food-facts.ts`, `search.ts`
- `apps/web/src/components/nutrition/mfp-import-panel.tsx`, `packaged-food-panel.tsx`, `nutrition-adherence-upgrade-banner.tsx`, `nutrition-diary.tsx`, `food-search.tsx`
- `apps/web/src/components/home/home-pro-upgrade-teaser.tsx`, `home-dashboard.tsx`
- `apps/web/src/components/progress/progress-dashboard.tsx`
- `apps/web/src/lib/nutrition/service.ts`, `page-data.ts`, `log-entry.ts`
- `apps/web/src/lib/home/types.ts`, `service.ts`
- `apps/web/src/lib/analytics/events.ts`
- `docs/marketing/mfp-differentiation.md`, `docs/PROGRESS.md`

### 2026-06-30 — MFP Q3 loop (train + fuel integration)

**What was done:**
- **Home “Train & fuel” card** — weekly workouts + today protein/calories with progress bars, training-day hints, CTAs to workout and diary (`home-integrated-loop.tsx`)
- **Post-workout refuel nudge** on workout recap → `/nutrition/log-macros?meal=` with time-based meal slot
- **Onboarding optional “What were you using before?”** — chips on step 11, saved to `profiles.signup_source`, GTM `forge_signup_source` event
- Migration `20260630100000_signup_source.sql`

**What's next (from mfp-differentiation.md):**
- Q4: MFP CSV import, selective barcode
- Q4: Pro projection/adherence upgrade moments
- Apply migration #46 on hosted Supabase if onboarding save fails

**Blockers:** None

**Files touched:**
- `apps/web/src/components/home/home-integrated-loop.tsx`, `home-dashboard.tsx`, `home-today-snapshot.tsx`
- `apps/web/src/components/workout/post-workout-nutrition-nudge.tsx`, `workout-recap.tsx`
- `apps/web/src/lib/nutrition/date-param.ts`, `quick-macro-log.tsx`, `log-macros-screen.tsx`, `nutrition-fab.tsx`
- `apps/web/src/components/onboarding/onboarding-wizard.tsx`, `app/actions/onboarding.ts`
- `apps/web/src/lib/constants/onboarding.ts`, `types/profile.ts`, `analytics/events.ts`, `supabase/schema-errors.ts`
- `supabase/migrations/20260630100000_signup_source.sql`
- `docs/marketing/mfp-differentiation.md`, `docs/supabase-setup.md`, `docs/PROGRESS.md`

### 2026-06-30 — MFP differentiation roadmap

**What was done:**
- Added `docs/marketing/mfp-differentiation.md` — positioning, three pillars, quarterly map (Q3 2026–Q2 2027), prioritized backlog, GTM, metrics, build handoff order
- Linked from `docs/marketing/seo-guides.md`

**What's next (from roadmap Q3 P0):**
- Home integrated dashboard — weekly training + nutrition adherence on one card
- Post-workout → diary nudge with meal slot pre-selected
- Optional onboarding “previous app” question for switcher analytics

**Blockers:** None

**Files touched:**
- `docs/marketing/mfp-differentiation.md`, `docs/marketing/seo-guides.md`, `docs/PROGRESS.md`

### 2026-06-30 — Watermark workout phase row

**What was done:**
- Week plan phase bar uses large low-opacity background icons (flame, lifter, recovery) with bold duration text centered in each equal column
- Replaced inline SVG watermarks with user-provided PNG assets (`public/icons/workout-phases/`), left-aligned and clipped on the left edge only

**Blockers:** None

**Files touched:**
- `apps/web/src/components/workout/workout-phase-cards.tsx`
- `docs/PROGRESS.md`

### 2026-06-30 — Compact workout schedule cards

**What was done:**
- Week plan cards show warm-up, main work, and recovery durations on **one line** with color-coded icons (flame, dumbbell, cool-down)
- Short expectation sentence below (e.g. push prep → upper work with exercise/set counts → recovery)

**Blockers:** None

**Files touched:**
- `apps/web/src/components/workout/workout-phase-cards.tsx`
- `docs/PROGRESS.md`

### 2026-06-30 — Fix stale completions after schedule regeneration

**What was done:**
- Workout completion status now matches sessions to the **plan week's calendar date**, not weekday index alone
- Prevents June 18/19 completed workouts from appearing done on a regenerated July schedule (same Thu/Fri indices)

**Blockers:** None

**Files touched:**
- `apps/web/src/lib/workouts/schedule-dates.ts`, `sessions.ts`, `next-session.ts`, `sessions.test.ts`
- `apps/web/src/components/workout/workout-hub.tsx`
- `docs/PROGRESS.md`

### 2026-06-30 — Body composition migration error messaging

**What was done:**
- Friendlier save errors when `fat_loss_pace` / `recomp_priority` / `goal_weight_kg` columns are missing (points to migration `20260611100000_body_composition_targets.sql`)
- Documented migrations 39–45 in `docs/supabase-setup.md`

**Blockers:** Hosted Supabase must run pending migrations (especially #45) — user hit schema cache error on plan save

**Files touched:**
- `apps/web/src/lib/supabase/schema-errors.ts`, `app/actions/program.ts`, `app/actions/onboarding.ts`
- `docs/supabase-setup.md`, `docs/PROGRESS.md`

### 2026-06-28 — Goal weight uses unit preference in profile settings

**What was done:**
- Program plan **Goal weight** field in Profile → Program & equipment now displays and accepts lb when unit preference is imperial (still stored as kg)

**Blockers:** None

**Files touched:**
- `apps/web/src/components/profile/program-plan-setting.tsx`
- `docs/PROGRESS.md`

### 2026-06-28 — Tier 2 nutrition diary UX

**What was done:**
- **Meal picker everywhere** — restaurant log, build-meal save & log; preferred meal slot persists in localStorage
- **Copy yesterday on Diary tab** — one tap when previous day has entries (compact when today already has logs)
- **Custom foods (My foods)** — save from diary row, quick log, or log-macros; searchable in meal builder with dedicated filter
- **Per-meal budget hints** — meal group headers show logged vs ~target kcal and protein (25/30/10/35 split)

**What's next:**
- Logging streak on Home; selective barcode/OFF re-entry for packaged foods
- MFP partner API (user sends email)

**Blockers:** None

**Files touched:**
- `apps/web/src/lib/nutrition/meal-budgets.ts`, `custom-foods.ts`, `builder-foods.ts`, `meal-types.ts`, `log-entry.ts`, `meal-budgets.test.ts`
- `apps/web/src/components/nutrition/copy-day-panel.tsx`, `logged-entries.tsx`, `nutrition-diary.tsx`, `restaurant-search-panel.tsx`, `meal-builder.tsx`, `quick-macro-log.tsx`, `meal-type-picker.tsx`
- `docs/phases/04-nutrition.md`, `docs/PROGRESS.md`

### 2026-06-28 — Whole-foods: lamb, herbs, onions, spices

**What was done:**
- Added 12 ingredients to `@forgefit/nutrition-core` whole-foods library: ground lamb, fresh mint/parsley/basil/thyme, red/white/yellow onion, cumin, salt, black pepper, dried oregano/thyme

**What's next:**
- Expand whole-foods from user-built meals as needed

**Blockers:** None

**Files touched:**
- `packages/nutrition-core/src/whole-foods.ts`
- `docs/PROGRESS.md`

### 2026-06-28 — Tier 1 nutrition diary UX (MFP-inspired)

**What was done:**
- **Meal slots** — breakfast/lunch/dinner/snack picker on quick log and saved-meal log sheet; defaults from time of day; diary groups entries by meal with subtotals
- **Edit entries** — `PATCH /api/nutrition/logs/[id]` + edit sheet (name, macros, meal)
- **Log again** — one tap on diary rows; preserves meal slot and line items
- **Favorites** — pin entries or quick-log cards via localStorage (`forgefit:nutrition-favorites`)
- **Quick log on diary home** — recents, favorites, and common presets without opening Log tab
- **Remaining highlight** — calories + protein left under compact macro summary
- **Copy day fix** — preserves `line_items` and `servings_logged` when copying a day

**What's next:**
- Tier 2: meal slot on restaurant/build-meal flows, copy-day UX polish
- MFP partner API email (blocked on user sending)

**Blockers:** None

**Files touched:**
- `apps/web/src/lib/nutrition/meal-types.ts`, `favorites.ts`, `log-entry.ts`, `meal-types.test.ts`
- `apps/web/src/app/api/nutrition/logs/[id]/route.ts`, `copy-day/route.ts`
- `apps/web/src/components/nutrition/meal-type-picker.tsx`, `edit-entry-sheet.tsx`, `diary-quick-log.tsx`, `logged-entries.tsx`, `nutrition-diary.tsx`, `quick-macro-log.tsx`, `log-meal-sheet.tsx`, `macro-summary.tsx`
- `apps/web/src/app/(app)/nutrition/page.tsx`
- `docs/phases/04-nutrition.md`, `docs/PROGRESS.md`

### 2026-06-28 — Nutrition diary date picker (backfill past days)

**What was done:**
- Added **Diary date** picker on Nutrition with prev/next arrows, Today/Yesterday chips, and calendar picker
- URL param `?date=YYYY-MM-DD` drives diary, log-macros, and build-meal (90-day lookback)
- Past-day banner + copy-from-previous-day on Browse tab for backfilling missed logs
- Energy budget panel hidden when viewing past days (targets still shown on macro summary)
- FAB and back links preserve selected date

**What's next:**
- Optional: show historical macro targets if plan changed since that date

**Blockers:** None

**Files touched:**
- `apps/web/src/lib/nutrition/date-param.ts`, `page-data.ts`
- `apps/web/src/components/nutrition/nutrition-date-picker.tsx`, `nutrition-diary.tsx`, `nutrition-fab.tsx`
- `apps/web/src/app/(app)/nutrition/page.tsx`, `log-macros/page.tsx`, `build-meal/page.tsx`
- `docs/PROGRESS.md`

### 2026-06-28 — Body composition targets (pace, recomp priority, goal weight)

**What was done:**
- Added onboarding step 6 for **fat-loss pace** (steady / moderate / aggressive) and **recomp priority** (muscle / balanced / lean out), mapped to evidence `daily_deficit_kcal` min/optimal/max and recomp base deficits
- Optional **goal weight** on onboarding + Profile → Program plan; Pro goal-date forecast uses `goalReachDate` from projection engine
- `program-engine`: pace-aware `computeNutrition`, `describeEffectiveDeficit` UI copy clarifying recomp ~200 kcal vs fat-loss deficits
- Migration `20260611100000_body_composition_targets.sql` — `fat_loss_pace`, `recomp_priority`, `goal_weight_kg` on `profiles`
- Updated TDEE panel, macro summary, week schedule, and weight projection chart copy

**What's next:**
- Apply migration `20260611100000_body_composition_targets.sql` to hosted Supabase
- Existing fat-loss users: set pace in Profile → Program plan and regenerate to refresh macros
- Optional: prompt existing fat-loss/recomp users to set pace on next login

**Blockers:** None

**Files touched:**
- `supabase/migrations/20260611100000_body_composition_targets.sql`
- `packages/program-engine/src/body-composition.ts`, `nutrition.ts`, `types.ts`
- `packages/projection-engine/src/weight-projection.ts`, `types.ts`
- `apps/web/src/components/onboarding/*`, `profile/program-plan-setting.tsx`
- `apps/web/src/app/actions/onboarding.ts`, `program.ts`
- `apps/web/src/lib/programs/service.ts`, `measurements/service.ts`, `nutrition/tdee-service.ts`
- `docs/phases/01-onboarding.md`, `docs/PROGRESS.md`

### 2026-06-28 — SEO guides & comparison articles

**What was done:**
- Added public `/guides` index and `/guides/[slug]` article routes (SSG) with Forge Ember marketing layout
- **4 training guides:** offline workout tracker, evidence-based programs, macro tracking for lifters, progressive overload
- **5 comparison articles:** vs Strong, Hevy, MyFitnessPal, MacroFactor, Fitbod — honest side-by-side tables
- SEO: per-article metadata, Article + Breadcrumb JSON-LD, sitemap entries, header/footer Guides links
- Developer doc: `docs/marketing/seo-guides.md`

**What's next:**
- Submit sitemap in Google Search Console after deploy
- Add 1–2 guides/month; link new posts from Instagram bio / content calendar
- Optional: FAQ schema on comparison pages; `/guides` CollectionPage JSON-LD

**Blockers:** None

**Files touched:**
- `apps/web/src/lib/seo/articles/*`, `article-metadata.ts`
- `apps/web/src/components/marketing/article-page.tsx`, `guides-index-content.tsx`, `article-json-ld.tsx`
- `apps/web/src/app/guides/page.tsx`, `guides/[slug]/page.tsx`, `sitemap.ts`
- `apps/web/src/components/marketing/marketing-header.tsx`, `marketing-data.ts`
- `docs/marketing/seo-guides.md`, `docs/PROGRESS.md`

### 2026-06-28 — Weekly weigh-in reminders

**What was done:**
- **In-app banner:** `WeighInReminderBanner` on Home and Progress when 7+ days since last weigh-in (or never logged) for `fat_loss` / `recomposition` goals
- **Core logic:** `weigh-in-reminder.ts` + service; unit tests for 7-day threshold and goal gating
- **Progress deep link:** `?tab=log#log-measurement` opens Log tab and scrolls to the measurement form
- **Optional push:** Profile toggle (`WeighInPushSetting`) for fat-loss/recomp users; general `/api/push/subscribe` (no community opt-in gate)
- **Cron:** `/api/cron/weigh-in-nudge` Sunday 14:00 UTC; `weekly_weigh_in_nudge` + `last_weigh_in_push_at` migration

**What's next:**
- Apply migration `20260611000000_weigh_in_push_preference.sql` to hosted Supabase
- Manual QA: banner at day 7+, push subscribe from Profile, cron in staging with VAPID keys

**Blockers:** None

**Files touched:**
- `supabase/migrations/20260611000000_weigh_in_push_preference.sql`
- `apps/web/src/lib/measurements/weigh-in-reminder*.ts`, `weigh-in-reminder.test.ts`
- `apps/web/src/lib/coaching/progress-push.ts`, `community-push.ts`
- `apps/web/src/components/measurements/weigh-in-reminder-banner.tsx`
- `apps/web/src/components/profile/weigh-in-push-setting.tsx`
- `apps/web/src/components/home/home-dashboard.tsx`, `progress/progress-dashboard.tsx`
- `apps/web/src/lib/home/service.ts`, `types.ts`; `lib/measurements/service.ts`, `types.ts`
- `apps/web/src/app/api/push/subscribe/route.ts`, `api/push/vapid-key/route.ts`
- `apps/web/src/app/api/cron/weigh-in-nudge/route.ts`
- `apps/web/src/app/actions/weigh-in-push.ts`
- `apps/web/src/app/(app)/profile/page.tsx`, `profile-settings-hub.tsx`
- `apps/web/vercel.json`, `apps/web/src/app/sw.ts`, `docs/PROGRESS.md`

### 2026-06-28 — TDEE energy visualization (3 layers)

**What was done:**
- **Layer 1 (Free):** Program TDEE breakdown — BMR, daily movement, training avg, goal adjustment with stacked bar + beginner hints (`buildPlanTdeeBreakdown` in program-engine)
- **Layer 2 (Free):** Today’s dynamic target — adjusts for logged workout burn vs plan average (`sumLoggedSessionsKcal`, `TdeeEnergyPanel` section 2)
- **Layer 3 (Pro):** Adaptive TDEE inferred from intake + weight trend with confidence band (`inferAdaptiveTdee` in projection-engine, `tdee_adaptive` gate)
- New `TdeeEnergyPanel` on Nutrition **Today** tab; macro summary footnotes deduped
- Shared `loadNutritionDailyTotals` helper; tier docs updated

**What's next:**
- Manual QA: legacy programs without layered nutrition fields, rest-day vs training-day target copy
- Optional: fold device active calories (Pro+) into daily NEAT slice

**Blockers:** None

**Files touched:**
- `packages/program-engine/src/tdee-breakdown.ts`, `logged-session-expenditure.ts`, tests, `index.ts`
- `packages/projection-engine/src/adaptive-tdee.ts`, test, `index.ts`
- `apps/web/src/lib/billing/gates.ts`
- `apps/web/src/lib/nutrition/tdee-service.ts`, `daily-totals.ts`, `page-data.ts`
- `apps/web/src/components/nutrition/tdee-energy-panel.tsx`, `nutrition-diary.tsx`, `macro-summary.tsx`
- `apps/web/src/lib/analytics/service.ts`
- `docs/TIER-GATES.md`, `docs/PROGRESS.md`

### 2026-06-28 — Nutrition tab layout redesign

**What was done:**
- Simplified main `/nutrition` Today tab to macro summary + logged entries only
- Added bottom-right FAB (+) with **Log macros** and **Build meal** actions
- New dedicated screens: `/nutrition/log-macros` (manual entry, presets, saved-meal quick log) and `/nutrition/build-meal` (full-screen ingredient builder)
- Renamed diary tab from "Log" to "Today"; deep-link support via `?tab=browse` / `?tab=my-meals`
- Moved all macro-entry UI off the main view; updated empty-state copy

**Follow-up (2026-06-28):** Home Today macros — removed extra links; tap macros → `/nutrition#energy-budget`. TDEE panel lives on Nutrition Today tab (`#energy-budget`).

**Follow-up (2026-06-28):** Layer 1 TDEE — enrich older stored programs at read time (`enrichNutritionTargets`); always render section 1/2 placeholders when data missing.

**Follow-up (2026-06-28):** Removed daily macro summary from `/nutrition/log-macros` — screen is entry-only; totals stay on main Today tab.

**What's next:**
- Manual QA at 375px: FAB placement above bottom nav, log-macros flow, build-meal return navigation
- Consider moving restaurant search to log-macros screen if users expect it under "add"

**Blockers:** None

**Files touched:**
- `apps/web/src/app/(app)/nutrition/page.tsx`
- `apps/web/src/app/(app)/nutrition/log-macros/page.tsx`
- `apps/web/src/app/(app)/nutrition/build-meal/page.tsx`
- `apps/web/src/components/nutrition/nutrition-diary.tsx`
- `apps/web/src/components/nutrition/nutrition-fab.tsx`
- `apps/web/src/components/nutrition/nutrition-back-link.tsx`
- `apps/web/src/components/nutrition/log-macros-screen.tsx`
- `apps/web/src/components/nutrition/build-meal-screen.tsx`
- `apps/web/src/components/nutrition/logged-entries.tsx`
- `apps/web/src/components/nutrition/saved-meals-library.tsx`
- `apps/web/src/lib/nutrition/page-data.ts`
- `docs/PROGRESS.md`

### 2026-06-27 — Google Tag Manager + Analytics

**What was done:**
- Installed GA4 tag (`G-VDVFTLJ0NF`) site-wide via `GoogleAnalytics` when GTM is not configured
- Added Google Tag Manager container support (`GoogleTagManager` + noscript fallback) for MNTN and other pixels
- When `NEXT_PUBLIC_GTM_CONTAINER_ID` is set, direct GA4 is disabled to avoid double-counting — configure GA4 as a tag inside GTM
- Shared env parsing in `lib/analytics/config.ts`; local dev requires explicit env vars for GTM/GA

**What's next:**
- In GTM: add GA4 Configuration tag (`G-VDVFTLJ0NF`), MNTN community template + pixel ID, publish container
- Set `NEXT_PUBLIC_GTM_CONTAINER_ID=GTM-57PG354W` on Vercel (optional — production default is baked in)
- Confirm Realtime in GA + MNTN pixel verification after deploy

**Blockers:** None

**Follow-up (2026-06-27):** GTM container ID `GTM-57PG354W` added to `.env.local`, production default in `config.ts`, and `.env.example`.

**Follow-up (2026-06-27):** Signup conversion tracking — app pushes `forge_signup` dataLayer event on new account creation (OAuth/email callback + instant email signup); GTM should use Custom Event trigger, not page URL.

**Files touched:**
- `apps/web/src/lib/analytics/config.ts`
- `apps/web/src/components/analytics/google-analytics.tsx`
- `apps/web/src/components/analytics/google-tag-manager.tsx`
- `apps/web/src/components/analytics/site-analytics.tsx`
- `apps/web/src/app/layout.tsx`
- `.env.example`
- `docs/PROGRESS.md`

### 2026-06-26 — Marketing homepage redesign

**What was done:**
- Redesigned public landing page (`/`) with sticky header, split hero + phone mockup, stats bar, bento feature grid, pricing cards (Free / Pro / Pro+), FAQ accordion, long-form SEO content, and rich footer
- Expanded SEO metadata (title, description, keywords, OG image) and JSON-LD (`FAQPage`, multi-tier `SoftwareApplication` offers)
- Added marketing animations (`marketing-float`, hero glow) with `prefers-reduced-motion` respect
- Centralized marketing copy in `marketing-data.ts` (FAQ, pricing tiers, SEO sections)

**What's next:**
- Manual QA: review landing page at 375px / desktop; verify anchor nav and signup CTAs
- Consider dedicated `/pricing` route if SEO needs a standalone URL
- Replace phone mockup with real app screenshots when marketing assets are ready

**Blockers:** None

**Files touched:**
- `apps/web/src/components/marketing/*` (hero, header, footer, pricing, FAQ, SEO content, app preview, icons, data, section layout)
- `apps/web/src/lib/seo/landing-metadata.ts`
- `apps/web/src/app/globals.css`
- `docs/PROGRESS.md`
- `docs/DESIGN.md`

### 2026-06-26 — Fitbit token refresh hardening

**What was done:**
- Auto-retry Fitbit sync once with a forced token refresh when Google returns auth errors (stale access token)
- Detect permanently revoked refresh tokens (`invalid_grant`) and surface reconnect instructions instead of raw API text
- Format stored sync errors and Profile integration error display through `formatIntegrationErrorForUser`

**What's next:**
- Confirm production `CRON_SECRET` is set so `/api/cron/sync-fitbit` refreshes tokens daily for connected users
- Manual QA: connect Fitbit → Sync now; revoke Google access → verify reconnect copy

**Blockers:** None

**Files touched:**
- `apps/web/src/lib/integrations/oauth-errors.ts`
- `apps/web/src/lib/integrations/user-errors.ts`
- `apps/web/src/lib/integrations/service.ts`
- `apps/web/src/components/profile/integrations-setting.tsx`
- `docs/PROGRESS.md`

### 2026-06-26 — Consolidate weight trend into projection chart

**What was done:**
- Removed redundant standalone “Weight trend” section from Progress → Trends
- Renamed remaining chart to “Weight trend & {horizon}-day projection” with solid/dashed line legend
- Deleted `measurement-trend-chart.tsx` and dropped unused `trends` payload from progress dashboard data

**What's next:**
- Manual QA: Progress → Trends shows one weight chart with logged history + forecast

**Blockers:** None

**Files touched:**
- `apps/web/src/components/progress/progress-dashboard.tsx`
- `apps/web/src/lib/measurements/service.ts`
- `apps/web/src/lib/measurements/types.ts`
- `docs/PROGRESS.md`

### 2026-06-26 — Weight trend includes full history + onboarding anchor

**What was done:**
- Onboarding now persists starting weight (and optional measurements) to `body_measurements` so the true onboarding value is kept even after later weigh-ins update `profiles.weight_kg`
- Weight trend chart always pins the earliest logged weight (starting point) even on Free tier’s 90-day window
- Removed synthetic profile baseline when real weight logs exist — it was reusing current profile weight at account `created_at`, which could show the wrong value
- Progress UI copy clarifies that starting weight is always shown on Free

**What's next:**
- Apply migration `supabase/migrations/20260610910000_backfill_onboarding_body_measurements.sql` in Supabase for existing accounts
- Manual QA: complete onboarding → log 2+ weigh-ins → confirm weight trend shows onboarding + all entries in window

**Blockers:** None

**Files touched:**
- `apps/web/src/app/actions/onboarding.ts`
- `apps/web/src/lib/measurements/service.ts`
- `apps/web/src/lib/analytics/service.ts`
- `apps/web/src/components/progress/progress-dashboard.tsx`
- `supabase/migrations/20260610910000_backfill_onboarding_body_measurements.sql`
- `docs/PROGRESS.md`

### 2026-06-25 — ForgeRep 5-year business plan

**What was done:**
- Authored `docs/business/forgeRep-5-year-business-plan.md` — 5-year path to ~$11.4M ARR / 80K paying subs, grounded in BIBLE, TIER-GATES, ADR 001, Instagram calendar, and community WACP north star
- Exported PDF via Chrome headless (`docs/business/forgeRep-5-year-business-plan.pdf`) + HTML source for re-print

**What's next:**
- Founder review of Y1–Y5 assumptions; adjust hiring/paid-acquisition gates if bootstrap-only
- Execute 90-day action plan (Phase 7 ship, Instagram calendar, funnel instrumentation)

**Blockers:** None

**Files touched:**
- `docs/business/forgeRep-5-year-business-plan.md`
- `docs/business/forgeRep-5-year-business-plan.pdf`
- `docs/business/forgeRep-5-year-business-plan.html`
- `docs/business/generate-pdf.mjs`
- `docs/PROGRESS.md`

### 2026-06-19 — Nutrition recipe servings + adjust-before-log UX

**What was done:**
- **Recipe mode:** Meal builder step 3 — set how many servings a full ingredient batch yields; per-serving macro preview
- **Adjust before log:** Saved meals on Log tab open `LogMealSheet` with servings stepper + per-ingredient quantity tweaks before posting
- **Logged meal details:** Expandable ingredient breakdown on diary entries; `line_items` + `servings_logged` persisted on `nutrition_logs`
- **My Meals library:** Cards show per-serving macros when recipe has multiple servings
- **Log tab order:** Today's logged entries moved above quick-add for easier review

**What's next:**
- Apply migration `supabase/migrations/20260610900000_nutrition_log_line_items.sql` in Supabase if not yet applied
- Manual QA: build 4-serving recipe → log 1 serving with tweaked ingredient → expand logged entry

**Blockers:** None

**Files touched:**
- `packages/nutrition-core/src/whole-foods.ts` — `scaleLineItems`, `perServingLineItems`, `adjustServingCount`
- `apps/web/src/lib/nutrition/saved-meals.ts` — `servings`, `getPerServingTotals`, `formatServingsLabel`
- `apps/web/src/lib/nutrition/log-entry.ts`, `types.ts`, `service.ts`
- `apps/web/src/app/api/nutrition/logs/route.ts`
- `apps/web/src/components/nutrition/meal-builder.tsx`, `log-meal-sheet.tsx`, `logged-entries.tsx`
- `apps/web/src/components/nutrition/saved-meals-quick-log.tsx`, `saved-meals-library.tsx`, `nutrition-diary.tsx`
- `supabase/migrations/20260610900000_nutrition_log_line_items.sql`
- `docs/PROGRESS.md`

---

### 2026-06-23 — @forgerep Instagram content calendar + Canva templates

**What was done:**
- Added **31-day Instagram content calendar** for @forgerep — profile setup, batch production guide, daily Reel/carousel/story instructions, hooks, hashtags, metrics
- Added **Myth vs Fact carousel template** — cover + content slide mockups, Canva build steps, ready-to-use copy from evidence-kb
- Expanded **Batch Day 0 screen recording playbook** — 10 clips, routes (`/home`, `/workout`, etc.), tap-by-tap actions, offline demo flow, file naming; onboarding corrected to 10 steps
- Reference PNGs in `docs/marketing/assets/`

**What's next:**
- Run **Batch Day 0** screen recordings using the playbook in `instagram-31-day-calendar.md`
- Build five Canva brand templates using `docs/marketing/canva-template-guide.md` (include Myth vs Fact set for Day 3)
- Set bio + link (`forge-rep.com/signup?utm_source=instagram&utm_medium=bio`) on @forgerep
- Publish Day 1 content per calendar; schedule Week 1 in Meta Business Suite

**Blockers:** None

**Files touched:**
- `docs/marketing/canva-template-guide.md` — Canva font substitutes (Montserrat / Open Sans)
- `docs/marketing/instagram-31-day-calendar.md`
- `docs/PROGRESS.md`

---

### 2026-06-19 — Onboarding PWA step visual fix

**What was done:**
- Onboarding step 10 always shows install guide (was blank on desktop/non-iOS when `beforeinstallprompt` never fired)
- Added `GenericInstallGuide` with address-bar mock + app icon for Chrome/Android/desktop
- Dismiss key no longer hides onboarding step; iOS guide shows app icon in browser mock

**Files touched:**
- `apps/web/src/components/pwa/install-prompt.tsx`
- `apps/web/src/components/pwa/generic-install-guide.tsx`
- `apps/web/src/components/pwa/ios-install-guide.tsx`
- `docs/PROGRESS.md`

### 2026-06-19 — Progress discoverability

**What was done:**
- Restored **Progress** to bottom nav (6 tabs: Home, Workout, Nutrition, Progress, Community, Profile)
- Always-visible **Progress** shortcut card on Home dashboard
- **Progress →** link in Today snapshot header (alongside Log food)

**Files touched:**
- `apps/web/src/components/layout/bottom-nav.tsx`
- `apps/web/src/components/home/home-progress-shortcut.tsx`
- `apps/web/src/components/home/home-dashboard.tsx`
- `apps/web/src/components/home/home-today-snapshot.tsx`
- `docs/PROGRESS.md`

### 2026-06-19 — Ground beef 80/20 and 75/25

**What was done:**
- Added **Ground beef (80% lean)** and **Ground beef (75% lean)** — 4 oz cooked; searchable as `80/20`, `75/25`, `hamburger`

**Files touched:**
- `packages/nutrition-core/src/whole-foods.ts`
- `docs/PROGRESS.md`

### 2026-06-19 — Ingredient suggestion submissions

**What was done:**
- Meal builder **no-results** state (2+ char search): form to suggest missing ingredients (name, optional category, notes)
- `POST /api/nutrition/ingredient-suggestions` — authenticated insert to Supabase
- Migration `20260610880000_nutrition_ingredient_suggestions.sql`
- Optional **Resend email** to `NUTRITION_INGREDIENT_FEEDBACK_TO` on each submission
- `GET /api/internal/nutrition-ingredient-suggestions` — review queue (CRON_SECRET + service role)

**What's next:**
- Apply migration `20260610890000_nutrition_ingredient_suggestions_fix.sql` if suggestions fail after 880000
- Set `NUTRITION_INGREDIENT_FEEDBACK_TO` in prod; reload Supabase API schema after migrations

**Files touched (fix):**
- `supabase/migrations/20260610890000_nutrition_ingredient_suggestions_fix.sql`
- `apps/web/src/app/api/nutrition/ingredient-suggestions/route.ts`
- `apps/web/src/lib/nutrition/ingredient-suggestion-errors.ts`

**Files touched:**
- `supabase/migrations/20260610880000_nutrition_ingredient_suggestions.sql`
- `apps/web/src/app/api/nutrition/ingredient-suggestions/route.ts`
- `apps/web/src/app/api/internal/nutrition-ingredient-suggestions/route.ts`
- `apps/web/src/lib/nutrition/ingredient-suggestion-email.ts`
- `apps/web/src/components/nutrition/ingredient-suggestion-panel.tsx`
- `apps/web/src/components/nutrition/meal-builder.tsx`
- `.env.example`, `docs/phases/04-nutrition.md`, `docs/PROGRESS.md`

### 2026-06-19 — Shredded cheese blends

**What was done:**
- Added shredded cheese options (1 oz): cheddar, mozzarella, **Mexican blend**, Colby Jack, pepper Jack, Italian, pizza, triple cheddar, Monterey Jack, four cheese blend

**Files touched:**
- `packages/nutrition-core/src/whole-foods.ts`
- `docs/PROGRESS.md`

### 2026-06-19 — Almond & cassava flour tortillas

**What was done:**
- Added **Almond flour tortilla** and **Cassava flour tortilla** (1 tortilla each) under Grains & starches

**Files touched:**
- `packages/nutrition-core/src/whole-foods.ts`
- `docs/PROGRESS.md`

### 2026-06-19 — GF all-purpose flour

**What was done:**
- Added **Gluten-free all-purpose flour** (1 tbsp) to pantry — searchable as `gf flour`, `1 to 1`, `gluten free`

**Files touched:**
- `packages/nutrition-core/src/whole-foods.ts`
- `docs/PROGRESS.md`

### 2026-06-19 — Whole-foods cooking pantry expansion (~90 → ~220 items)

**What was done:**
- New **Pantry & baking** category: granulated/brown/powdered/coconut sugar, honey, maple, agave, molasses, flours, cornstarch, breadcrumbs, oats, broths, vinegars, canned tomatoes/coconut milk, tomato paste, olives, pickles
- Expanded **protein** (turkey breast, pork, lamb, cod, scallops, deli meats, smoked salmon)
- Expanded **produce** (garlic, ginger, lemon/lime, celery, zucchini, cauliflower, kale, squash, more fruit)
- Expanded **grains** (couscous, barley, bulgur, pita, naan, granola, pancakes/waffles)
- Expanded **dairy** (ricotta, sour cream, heavy cream, more cheeses, oat/soy milk)
- Expanded **legumes**, **fats/nuts/seeds**, **condiments** (teriyaki, hoisin, tahini, pesto, Caesar, etc.)
- Honey/maple moved to Pantry; search terms on sugars (`"sugar"`) for easy lookup

**What's next:**
- User feedback on gaps; consider Supabase sync for saved meals

**Files touched:**
- `packages/nutrition-core/src/whole-foods.ts`
- `docs/PROGRESS.md`

### 2026-06-19 — Universal fractional quantities

**What was done:**
- **Fractional stepping is now the default** for all whole-foods (¼, ⅓, ½, ¾, whole) via shared ladder in `nutrition-core`
- Normalized multi-unit serving labels to per-1-unit bases (bacon slice, rice cake, corn tortilla, avocado, legumes, deli meats, 2 tbsp condiments → 1 tbsp, etc.) so fractions map to real portions
- `formatLineItemPortion` shows intuitive labels: "2 slice", "½ × 4 oz cooked", "1 cup" at qty 1
- Ladder max raised to 24 for count foods (bread slices, eggs, etc.)

**What's next:**
- User feedback on portions/macros; expand whole-foods from most-built meals

**Files touched:**
- `packages/nutrition-core/src/whole-foods.ts`
- `docs/PROGRESS.md`

### 2026-06-19 — Whole-foods library expansion (~50 → ~90 items)

**What was done:**
- Added **Condiments & sauces** category (mayo, mustard, ketchup, salsa, ranch, vinaigrette, marinara, BBQ, honey, etc.)
- Expanded protein (bacon, rotisserie chicken, roast beef deli, sausage, jerky), dairy (cream cheese, parmesan, feta, almond milk, more cheeses), grains (bagel, English muffin, white bread, corn, rice cakes), produce (orange, romaine, cucumber, mushrooms, onion)
- **searchTerms** on foods for easier lookup (e.g. "mayo" → Mayonnaise, "wrap" → tortilla)
- Meal builder: ordered category filters, better search placeholder, empty-state hints

**What's next:**
- User feedback on portions/macros; expand based on most-built meals

**Files touched (expansion):**
- `packages/nutrition-core/src/whole-foods.ts`
- `apps/web/src/components/nutrition/meal-builder.tsx`

### 2026-06-19 — Whole-foods: sourdough + whole milk

**What was done:**
- Added **Whole milk** (1 cup) and **Sourdough bread** (1 slice) to curated ingredient list

**Files touched:**
- `packages/nutrition-core/src/whole-foods.ts`
- `docs/PROGRESS.md`

### 2026-06-19 — Meal builder 3-step wizard

**What was done:**
- Build meal flow split into steps: (1) Name, (2) Ingredients, (3) Category & save
- Step progress bar + labels in header; meal name chip visible on steps 2–3
- Ingredient search in bounded scroll panel; added items in compact list above

**Files touched:**
- `apps/web/src/components/nutrition/meal-builder.tsx`
- `docs/PROGRESS.md`

### 2026-06-19 — Whole-foods library expansion (~50 → ~90 items)

**What was done:**
- Removed USDA / Open Food Facts search from Nutrition Browse tab (API route retained but unused in UI)
- Added `@forgefit/nutrition-core` **whole-foods** database (~50 common ingredients with clear portions, e.g. "2 large eggs", "4 oz chicken")
- **Meal builder** — multi-ingredient meals with quantity steppers, category, save & log
- Saved meals now store **line items** (ingredient list + quantities); totals derived from lines
- **Log meal sheet** — one-time portion adjustments when logging a saved template; saved meal unchanged
- Legacy macro-only saved meals still work (adjust macros at log time)

**What's next:**
- Expand whole-foods list based on user feedback (more cuts, brands, portions)
- Consider Supabase sync for saved meals cross-device
- User QA: build breakfast from eggs + oatmeal + berries, save, log with tweaked portions

**Blockers:** None

**Files touched:**
- `packages/nutrition-core/src/whole-foods.ts` (new)
- `packages/nutrition-core/src/macros.ts`
- `packages/nutrition-core/src/index.ts`
- `apps/web/src/lib/nutrition/saved-meals.ts`
- `apps/web/src/components/nutrition/meal-builder.tsx` (new)
- `apps/web/src/components/nutrition/log-meal-sheet.tsx` (new)
- `apps/web/src/components/nutrition/saved-meals-library.tsx`
- `apps/web/src/components/nutrition/nutrition-diary.tsx`
- `apps/web/src/app/(app)/nutrition/page.tsx`
- `docs/BIBLE.md`, `docs/PROGRESS.md`, `docs/phases/04-nutrition.md`

### 2026-06-19 — Saved Meals library + custom categories

**What was done:**
- New **My Meals** tab — full library view with search, category filters, grouped meal cards, one-tap log
- **Save meal sheet** (bottom sheet) — name, category picker, inline “+ New category”, macro preview or editable fields for create-from-scratch
- Custom categories stored in localStorage alongside meals; default set: Breakfast, Lunch, Dinner, Snacks, Favorites
- Save from **quick log**, **recent items** (bookmark icon), and **restaurant quick-log** — all route through category picker
- Migrated legacy `macro-presets` localStorage to new saved-meals format
- Example plates moved to collapsible section on Browse tab

**What's next:**
- User QA on My Meals at 375px — category creation, save-from-recent, library search
- Consider syncing saved meals to Supabase for cross-device (Pro+?) if users request it

**Blockers:** None

**Files touched:**
- `apps/web/src/lib/nutrition/saved-meals.ts` (new)
- `apps/web/src/lib/nutrition/presets.ts`
- `apps/web/src/components/nutrition/save-meal-sheet.tsx` (new)
- `apps/web/src/components/nutrition/saved-meals-library.tsx` (new)
- `apps/web/src/components/nutrition/nutrition-diary.tsx`
- `apps/web/src/components/nutrition/macro-presets.tsx`
- `apps/web/src/components/nutrition/quick-macro-log.tsx`
- `apps/web/src/components/nutrition/restaurant-search-panel.tsx`
- `apps/web/src/app/(app)/nutrition/page.tsx`
- `docs/PROGRESS.md`
- `docs/phases/04-nutrition.md`

### 2026-06-19 — Nutrition Log tab macro-entry UX

**What was done:**
- Merged today's macro summary + manual log form into one primary card on the Log tab
- Quick macro form: all four macros always visible (no hidden carbs/fat toggle), color-coded labels, "X left" hints vs targets
- Relaxed validation — any macro field can be logged (not calories + protein required together)
- Quick add: horizontal scroll strips — common meals as chips, recent/saved as compact cards with **+ Log** one-tap
- Tap recent/saved name to prefill the form for edits before logging

**What's next:**
- Deploy recent fixes to production (Withings probe, bodyweight filter, regen scheduling, HR zones)
- User QA on nutrition Log tab at 375px — confirm scroll strips and one-tap logging feel right

**Blockers:** None

**Files touched:**
- `apps/web/src/components/nutrition/quick-macro-log.tsx`
- `apps/web/src/components/nutrition/macro-presets.tsx`
- `apps/web/src/components/nutrition/nutrition-diary.tsx`
- `apps/web/src/components/nutrition/logged-entries.tsx`
- `apps/web/src/app/(app)/nutrition/page.tsx`
- `docs/PROGRESS.md`

### 2026-06-19 — Withings polish + integration QA

**What was done:**
- Profile → Integrations shows Withings Partner Hub callback URL when configured (same pattern as Spotify)
- Wired `providerOAuthRedirectUris` through profile page → settings hub → integrations card
- OAuth callback probe (200 on HEAD/GET) extended to Fitbit and Strava callbacks
- Equipment save: “Regenerate program” defaults to **checked**
- Added `docs/integrations/withings-setup.md` — env, Partner Hub, connect/sync QA checklist

**What's next:**
- **Deploy** recent fixes to production (Withings probe, bodyweight filter, regen scheduling, HR zones)
- **Vercel:** confirm `WITHINGS_*` + `INTEGRATIONS_TOKEN_ENCRYPTION_KEY` on Production; redeploy
- **Withings Partner Hub:** register callback, pass URL test, Connect from Pro+ account, verify weight on Progress
- User QA: regen program after bodyweight-only fix; Fitbit re-sync for zone bars

**Blockers:** None in code — production Withings QA depends on env + Partner Hub registration.

**Files touched:**
- `apps/web/src/app/(app)/profile/page.tsx`
- `apps/web/src/components/profile/profile-settings-hub.tsx`
- `apps/web/src/components/profile/integrations-setting.tsx`
- `apps/web/src/components/profile/equipment-setting.tsx`
- `apps/web/src/app/api/integrations/fitbit/callback/route.ts`
- `apps/web/src/app/api/integrations/strava/callback/route.ts`
- `docs/integrations/withings-setup.md`
- `docs/PROGRESS.md`

### 2026-06-19 — Production ops complete (Stripe + Supabase)

**What was done:**
- Confirmed production: all Supabase migrations applied
- Confirmed production: Stripe Pro / Pro+ products, prices, and webhook configured

**What's next:**
- Withings: Vercel env + Partner Hub QA + Connect / weight sync
- Strava: enable integration when prioritized

**Files touched:**
- `docs/PROGRESS.md`, `docs/BIBLE.md`, `docs/TIER-GATES.md`, `docs/phases/07-integrations.md`

### 2026-06-19 — Spotify auto-shuffle on playlist start

**What was done:**
- After `PUT /me/player/play` with a playlist context, ForgeRep calls `PUT /me/player/shuffle?state=true` on the same device
- Applies to workout start, auto-start, and play-from-idle (not plain resume of paused session)

**Files touched:**
- `packages/integrations/src/spotify.ts`, `index.ts`
- `docs/PROGRESS.md`

### 2026-06-19 — Workout Spotify player UI

**What was done:**
- Single Spotify card when connected (hides redundant vibe strip)
- Full track title (2-line clamp), artist on second line
- Large centered controls: 56px skip buttons + 64px ember play/pause
- Simplified header with playlist name + “Open app” link

**Files touched:**
- `apps/web/src/components/workout/workout-music-transport.tsx`
- `apps/web/src/components/workout/workout-music-picker.tsx`
- `apps/web/src/components/workout/active-workout.tsx`
- `docs/PROGRESS.md`

### 2026-06-19 — Spotify native app handoff from PWA
- Applies to vibe picker, wake-and-retry, and “Open playlist in Spotify” — all use `openSpotifyPlaylist()`

**Files touched:**
- `apps/web/src/lib/workout-music/open-spotify.ts`
- `docs/spotify-integration-plan.md`, `docs/PROGRESS.md`

### 2026-06-19 — Spotify wake-and-retry (cold start)

**What was done:**
- Spotify Connect cannot control the phone until the app is awake — documented platform limit
- Press ▶ with no active device: opens workout playlist in Spotify, retries API start every 2s (~12s)
- Auto-start on workout begin uses same wake flow when remote start fails
- Idle transport hint: "Press ▶ to open Spotify and start your workout playlist"

**Files touched:**
- `apps/web/src/lib/workout-music/spotify-wake-playback.ts`
- `apps/web/src/components/workout/workout-music-transport.tsx`
- `apps/web/src/components/workout/workout-hub.tsx`
- `docs/PROGRESS.md`

### 2026-06-19 — Spotify play/pause transport fix

**What was done:**
- Fixed pause API call: Spotify requires `PUT /me/player/pause` (was incorrectly `POST`) — skip worked, pause did not
- Resume/play sends `{}` body with `Content-Type: application/json`; targets active `device_id` from playback state
- Play falls back to starting default workout playlist when resume has no active context
- **Device discovery:** when Spotify has no active player, resolve phone via `/me/player/devices`, transfer Connect target, then start playlist
- Transport sends explicit `pause`/`resume` (not server toggle re-fetch); optimistic UI + larger 48px tap targets

**What's next:**
- Deploy and QA play/pause on production with Spotify app open (Premium)

**Files touched:**
- `packages/integrations/src/spotify.ts`
- `apps/web/src/lib/integrations/spotify-service.ts`
- `apps/web/src/app/api/integrations/spotify/playback/route.ts`
- `apps/web/src/components/workout/workout-music-transport.tsx`
- `docs/PROGRESS.md`

### 2026-06-19 — Fitbit HR zone bar fix (moderateTime / vigorousTime)

**What was done:**
- Google Health exercise zones use `moderateTime` / `vigorousTime`, not `fatBurnTime` / `cardioTime` — parser now maps both; fixes single-color zone bar on workout recap
- Watch intensity card shows zone legend with minutes per band

**What's next:**
- Re-sync Fitbit (Profile → Integrations → Sync) to refresh past workout zone breakdowns

**Files touched:**
- `packages/integrations/src/google-health.ts`, `google-health-exercise.test.ts`
- `apps/web/src/components/workout/workout-device-intensity-card.tsx`
- `docs/PROGRESS.md`

### 2026-06-19 — Program regenerate: forward-only weekdays

**What was done:**
- Regenerating a plan now schedules from today through Sunday before wrapping to earlier weekdays (avoids new sessions on past days mid-week when possible)
- Completed workout logs are unchanged — still matched by weekday slot (Mon=0 … Sun=6)

**What's next:**
- User can rebuild plan again from Profile → Program plan to pick up scheduling fix
- Consider week-scoped session history so regen never reuses past calendar labels

**Files touched:**
- `packages/program-engine/src/schedule.ts`, `generate.ts`, `types.ts`, `schedule.test.ts`
- `apps/web/src/lib/programs/service.ts`
- `docs/PROGRESS.md`

### 2026-06-19 — Withings callback URL probe (307 fix)

**What was done:**
- Withings Partner Hub URL test sends HEAD/GET without OAuth params; callback now returns 200 instead of 307 redirect
- Production still needs Vercel env: `WITHINGS_CLIENT_ID`, `WITHINGS_CLIENT_SECRET`, `INTEGRATIONS_TOKEN_ENCRYPTION_KEY`

**What's next:**
- Add Withings env vars to Vercel Production and redeploy
- Re-test callback URL in Withings dashboard; then Connect from Profile

**Files touched:**
- `apps/web/src/lib/integrations/oauth-callback-probe.ts`
- `apps/web/src/app/api/integrations/withings/callback/route.ts`
- `docs/PROGRESS.md`

### 2026-06-19 — Bodyweight-only equipment filter fix

**What was done:**
- Fixed `isExerciseAvailable` — bodyweight-only users no longer inherit machine exercises tagged with `bodyweight_only` (Back Extension / hyperextension bench)
- Removed incorrect `bodyweight_only` tag from `hip_hinge_machine`; added `bodyweight_hip_hinge` (Glute Bridge) for hinge work without gym gear
- Curated exercise aliases now preserve program-engine equipment metadata; catalog hyperextension entry tagged `machines`
- Tests: `packages/program-engine/src/equipment-filter.test.ts`

**What's next:**
- User with existing program: Profile → Equipment or Program → regenerate so lower-body hinge slot picks Glute Bridge instead of Back Extension
- Consider defaulting “Regenerate program” on equipment save to true

**Files touched:**
- `packages/exercise-db/src/availability.ts`, `exercises.ts`, `resolve.ts`, `index.ts`, `data/catalog.json`
- `packages/program-engine/src/equipment-filter.test.ts`
- `docs/PROGRESS.md`

### 2026-06-19 — Withings integration UI enabled

**What was done:**
- Flipped `INTEGRATION_AVAILABLE.withings` so Profile → Integrations shows Connect (was hardcoded "Coming soon" while OAuth code was already built)
- Updated Withings description and privacy copy

**What's next:**
- Add to `apps/web/.env.local` (and Vercel): `WITHINGS_CLIENT_ID`, `WITHINGS_CLIENT_SECRET`, `INTEGRATIONS_TOKEN_ENCRYPTION_KEY` (`openssl rand -base64 32`)
- Register redirect URI in Withings Partner Hub: `{NEXT_PUBLIC_SITE_URL}/api/integrations/withings/callback`
- Restart dev server; Pro+ account → Profile → Integrations → Connect Withings; QA weight import

**Files touched:**
- `apps/web/src/lib/integrations/types.ts`, `apps/web/src/lib/legal/copy.ts`
- `docs/phases/07-integrations.md`, `docs/TIER-GATES.md`, `docs/PROGRESS.md`

### 2026-06-19 — Spotify OAuth redirect URI (local dev)

**What was done:**
- `spotifyOAuthRedirectUri(request)` — uses browser origin in dev when `NEXT_PUBLIC_SITE_URL` is production; optional `SPOTIFY_OAUTH_REDIRECT_URI` override
- Connect stores redirect URI in OAuth cookie; callback reuses same URI for token exchange
- Profile Workout music shows exact redirect URI to register in Spotify Dashboard
- `.env.example` documents redirect URI setup

**What's next:**
- **Production:** set `NEXT_PUBLIC_SITE_URL=https://forge-rep.com` on Vercel, redeploy, register `https://forge-rep.com/api/integrations/spotify/callback` in Spotify (localhost alone is not enough)
- User: add `http://localhost:3000/api/integrations/spotify/callback` to Spotify Developer Dashboard when testing locally (see Profile → Workout music hint)
- Run migration `20260610870000_spotify_integration.sql` if not applied
- QA connect + playback with Spotify Premium

**Files touched:**
- `apps/web/src/lib/integrations/config.ts`, `oauth-state.ts`, `spotify-service.ts`
- `apps/web/src/app/api/integrations/spotify/connect/route.ts`, `callback/route.ts`, `status/route.ts`
- `apps/web/src/components/profile/workout-music-setting.tsx`
- `.env.example`, `docs/PROGRESS.md`

### 2026-06-19 — Profile sections collapsed by default

**What was done:**
- Wrapped Subscription, Workout music, and Privacy & data in `CollapsibleSection` (all collapsed by default)
- Collapsible sections auto-expand when linked via hash (`#subscription`, `#integrations`, `#gamification`, `#workout-music`)
- Subscription / workout music auto-open when returning from Stripe checkout or Spotify OAuth

**Files touched:**
- `apps/web/src/components/layout/collapsible-section.tsx`
- `apps/web/src/components/profile/profile-settings-hub.tsx`
- `apps/web/src/components/profile/subscription-setting.tsx`, `workout-music-setting.tsx`, `privacy-data-setting.tsx`
- `apps/web/src/app/(app)/profile/page.tsx`
- `docs/PROGRESS.md`

### 2026-06-19 — Spotify Phase B (OAuth + playback control)

**What was done:**
- Migration `20260610870000_spotify_integration.sql` — `spotify` integration provider + profile workout music prefs
- `packages/integrations/src/spotify.ts` — PKCE OAuth, token refresh, playback API
- API routes: connect, callback, disconnect, status, preferences, playback, autostart
- Profile → **Workout music** section (connect, default vibe, auto-start toggle) — not gated behind Pro+
- Active workout Spotify transport bar (play/pause/skip, now playing)
- Non-blocking auto-start on workout begin when enabled

**What's next:**
- Run migration locally/production: `supabase db push`
- QA connect flow + playback on device with Spotify Premium + Spotify app open
- Register redirect URI in Spotify Dashboard if not already: `{NEXT_PUBLIC_SITE_URL}/api/integrations/spotify/callback`

**Blockers:** None

**Files touched:**
- `supabase/migrations/20260610870000_spotify_integration.sql`
- `packages/integrations/src/spotify.ts`, `withings.ts`, `index.ts`
- `apps/web/src/lib/integrations/spotify-service.ts`, `config.ts`, `oauth-state.ts`, `oauth-state-token.ts`, `types.ts`
- `apps/web/src/app/api/integrations/spotify/**`
- `apps/web/src/components/profile/workout-music-setting.tsx`, `profile-settings-hub.tsx`
- `apps/web/src/components/workout/workout-music-transport.tsx`, `active-workout.tsx`, `workout-hub.tsx`
- `apps/web/src/app/(app)/profile/page.tsx`, `workout/page.tsx`
- `apps/web/src/lib/legal/copy.ts`, `.env.example`, docs

### 2026-06-19 — ForgeRep Spotify playlists + attribution

**What was done:**
- Swapped workout music catalog to ForgeRep-owned Spotify playlist IDs (Focus, Pump, Cardio, Cooldown)
- Added Spotify logo attribution component on workout music picker (full + compact variants)

**What's next:**
- Phase B Spotify OAuth + in-session playback controls (optional)
- Phase 7: Withings / Strava integrations

**Blockers:** None

**Files touched:**
- `apps/web/src/lib/workout-music/catalog.ts`
- `apps/web/src/components/workout/workout-music-picker.tsx`, `spotify-attribution.tsx`
- `docs/PROGRESS.md`

### 2026-06-19 — Spotify workout music fixes (PWA open + playlists)

**What was done:**
- Fixed PWA white-screen flash: removed `spotify:` scheme + delayed `window.open`; use single https link click (same context on iOS / installed PWA so universal links hand off to Spotify)
- Replaced unavailable editorial playlist IDs with verified public playlists (instrumental gym, pump, running, stretch/cooldown)

**What's next:**
- QA open flow on iOS home-screen PWA + Android
- Replace interim public playlists with ForgeRep-owned playlists before launch

**Blockers:** None

**Files touched:**
- `apps/web/src/lib/workout-music/open-spotify.ts`, `catalog.ts`
- `docs/PROGRESS.md`

### 2026-06-19 — Spotify workout music Phase A

**What was done:**
- Implemented curated workout music picker — Focus, Pump, Cardio, Cooldown vibes with Spotify deep links
- `WorkoutMusicPicker` on workout hub (`WeekPlanCard`) for upcoming/in-progress days; compact dismissible strip in `ActiveWorkout`
- Last-selected vibe persisted in `localStorage`; offline-safe (saves vibe, defers Spotify open until online)
- Interim Spotify editorial playlist IDs in `catalog.ts` — swap for ForgeRep-owned playlists before launch

**What's next:**
- Replace placeholder playlist IDs with ForgeRep brand playlists
- Phase B: Spotify Developer app, OAuth PKCE, playback transport + auto-start (see `docs/spotify-integration-plan.md`)

**Blockers:** None

**Files touched:**
- `apps/web/src/lib/workout-music/catalog.ts`, `preferences.ts`, `open-spotify.ts`
- `apps/web/src/components/workout/workout-music-picker.tsx`
- `apps/web/src/components/workout/week-plan-card.tsx`, `active-workout.tsx`
- `docs/spotify-integration-plan.md`, `docs/PROGRESS.md`, `docs/BIBLE.md`, `README.md`

### 2026-06-19 — Spotify workout music plan (Phase A & B)

**What was done:**
- Authored `docs/spotify-integration-plan.md` — Phase A (curated playlist deep links, all tiers, no backend) and Phase B (Spotify OAuth PKCE, playback API, transport bar, auto-start toggle)
- Defined tier placement: free for all ForgeRep tiers; Spotify Premium is the external paywall
- Scoped Spotify out of Pro+ device integrations UI — dedicated Profile → Workout music section
- Explicit non-goals: Web Playback SDK, rest-timer sync, in-PWA streaming

**What's next:**
- Phase A: create brand Spotify playlists, implement `workout-music-picker` on workout hub + active workout
- Phase B: Spotify Developer app, migration (`spotify` provider + profile prefs), OAuth routes, transport bar

**Blockers:** None (Phase A needs ForgeRep-owned playlist IDs before launch)

**Files touched:**
- `docs/spotify-integration-plan.md`
- `docs/PROGRESS.md`

### 2026-06-19 — Bodyweight exercise logging & recap fix

**What was done:**
- Added `@forgefit/exercise-db` helpers `isBodyweightOnlyExercise` and `exerciseTracksWeight` (push-ups, bodyweight squats, planks, band-only work skip weight)
- Workout logger (`set-row`) hides the weight field for bodyweight-only exercises — reps only
- Workout recap shows reps-only sets (e.g. `12 reps`) instead of `—` when weight is absent
- Session comparison treats bodyweight best sets by rep count, not weight delta

**What's next:**
- Consider a separate `weighted_push_up` exercise if users need to log added load
- Pull-ups/chin-ups may deserve the same reps-only treatment (equipment is `pull_up_bar`, not `bodyweight_only`)

**Blockers:** None

**Files touched:**
- `packages/exercise-db/src/tracking.ts`, `packages/exercise-db/src/index.ts`
- `apps/web/src/lib/workouts/set-display.ts`, `apps/web/src/lib/workouts/comparison.ts`
- `apps/web/src/components/workout/set-row.tsx`, `workout-recap.tsx`, `active-workout.tsx`
- `apps/web/src/lib/progression/one-rep-max.ts`

### 2026-06-08 — Community Phase 7 (growth & measurement)

**What was done:**
- Migration `20260610860000_community_metrics_email.sql` — action events, email prefs, send log
- WACP instrumentation via `recordCommunityAction()` on score upsert, cheer, follow, reaction, comment, opt-in
- Moderator ops metrics panel + `GET /api/internal/community-metrics`
- Weekly recap email (Resend) + Monday cron; profile email toggle

**Apply migration:** `20260610860000_community_metrics_email.sql`

**What's next:** External analytics dashboard; Strava / Withings integrations

**Files touched:**
- `supabase/migrations/20260610860000_community_metrics_email.sql`
- `apps/web/src/lib/coaching/community-metrics.ts`, `community-email.ts`, `community-weekly-recap.ts`, `community-week.ts`
- `apps/web/src/app/api/cron/community-weekly-recap`, `api/internal/community-metrics`
- `apps/web/src/components/coaching/community-ops-metrics-panel.tsx`, `profile/community-email-setting.tsx`
- `apps/web/vercel.json`, `.env.example`, docs

---

### 2026-06-08 — Community Phase 6 (scale & polish)

**What was done:**
- Migration `20260610850000_community_phase6.sql` — preset reactions/comments, score flags, moderation columns, opt-in A/B variant
- Win feed: preset reactions + quick-reply comments (`community-win-interactions.tsx`)
- Anti-gaming heuristics on score upsert; flagged scores excluded from leaderboards until cleared
- Moderator panel on Community feed tab (hide wins, clear flags, suspend users)
- Opt-in A/B: `control` vs `default_on_ui` with privacy-forward copy (env-gated)

**Apply migration:** `20260610850000_community_phase6.sql`

**What's next:** Community metrics instrumentation (WACP, opt-in funnel); weekly email recap

**Files touched:**
- `supabase/migrations/20260610850000_community_phase6.sql`
- `apps/web/src/lib/coaching/community-reactions.ts`, `community-anti-gaming.ts`, `community-moderation.ts`, `community-opt-in-experiment.ts`, `community-leaderboard-filters.ts`
- `apps/web/src/lib/coaching/service.ts`, `types.ts`, `community-leagues.ts`, `community-crews.ts`
- `apps/web/src/app/actions/gamification.ts`, `community.ts`
- `apps/web/src/components/coaching/community-win-interactions.tsx`, `community-moderation-panel.tsx`
- `apps/web/src/components/community/community-hero.tsx`, `community-page-client.tsx`
- `apps/web/src/components/profile/gamification-setting.tsx`
- `docs/community-expansion-plan.md`, `docs/PROGRESS.md`

---

### 2026-06-08 — Community Phase 5 (leagues & seasons)

**What was done:**
- Migration `20260610830000_community_leagues.sql` — league tiers, season results, badges, hall of fame
- Bronze / Silver / Gold tiers within each goal×experience bucket; weekly rank scoped to tier
- End-of-month promotion (top 30%) and relegation (bottom 30%) via `processSeasonRollover`
- Persistent badges + in-app notifications for promote / relegate / season champion
- UI: `LeagueStatusCard`, `SeasonRecapCard`, `HallOfFameCard`, `LeagueTierBadge`
- Cron `/api/cron/community-season-rollover` (07:00 UTC on the 1st)
- Activity/sleep/recovery timezone fix (user local calendar day via `forge-timezone` cookie)

**Apply migration:** `20260610830000_community_leagues.sql`

**What's next:** Community metrics instrumentation (WACP, opt-in funnel); weekly email recap

**Files touched:**
- `supabase/migrations/20260610830000_community_leagues.sql`
- `apps/web/src/lib/coaching/community-leagues.ts`
- `apps/web/src/lib/coaching/service.ts`, `types.ts`, `community-labels.ts`
- `apps/web/src/components/coaching/league-*.tsx`, `season-recap-card.tsx`, `hall-of-fame-card.tsx`
- `apps/web/src/app/api/cron/community-season-rollover/route.ts`
- `apps/web/vercel.json`
- `docs/community-expansion-plan.md`

---

### 2026-06-18 — Nutrition diary timezone fix

**What was done:**
- Fixed "today's macros" rolling to the next day after ~8pm US Eastern (UTC date boundary bug)
- Added `@/lib/datetime/local-date` — timezone-aware `YYYY-MM-DD` formatting
- Added `TimezoneSync` client component — stores IANA timezone in `forge-timezone` cookie and refreshes SSR
- Nutrition service, home dashboard, and `/api/nutrition/logs` now resolve dates in the user's timezone
- Client-side logging uses the browser's local calendar day via `browserTodayIsoDate()`

**What's next:** Apply same timezone cookie pattern to activity/sleep/recovery "today" displays if users report similar issues

**Files touched:**
- `apps/web/src/lib/datetime/local-date.ts`
- `apps/web/src/lib/datetime/local-date.test.ts`
- `apps/web/src/lib/datetime/timezone.ts`
- `apps/web/src/components/datetime/timezone-sync.tsx`
- `apps/web/src/lib/nutrition/service.ts`
- `apps/web/src/lib/nutrition/log-entry.ts`
- `apps/web/src/app/(app)/nutrition/page.tsx`
- `apps/web/src/app/api/nutrition/logs/route.ts`
- `apps/web/src/components/nutrition/nutrition-diary.tsx`
- `apps/web/src/app/(app)/layout.tsx`

---

### 2026-06-08 — Community Phase 4 (web push)

**What was done:**
- Migration `20260610820000_community_push.sql` — push subscriptions + preferences
- VAPID web push via `web-push`; subscribe API; Profile preference toggles
- Service worker push + notification click handlers in `sw.ts`
- In-app community notifications also send push when enabled
- Sunday cron `/api/cron/community-sunday-nudge` (22:00 UTC Sundays)

**Setup:** VAPID keys + `SUPABASE_SERVICE_ROLE_KEY` (see `.env.example`)

**What's next:** Community Phase 5 — leagues & seasons

---

### 2026-06-08 — Community Phase 3 (crews & challenges)

**What was done:**
- Migration `20260610800000_community_crews_challenges.sql` — crews, members, weekly challenge status
- Weekly bucket challenges (rotating plan / quality / protein) with bucket completion stats
- Crew create/join/leave, invite link at `/community/join?code=…`, max 8 members
- Crew shared goal (80% complete weekly challenge), crew win feed, shareable recap
- UI: `CrewPanel`, `WeeklyChallengeCard`, `CrewWinsFeed`, `ShareRecapButton`

**Apply migration:** `20260610800000_community_crews_challenges.sql`

**What's next:**
1. Community Phase 4 — web push notifications
2. Apply pending community migrations on production

**Files touched:**
- `supabase/migrations/20260610800000_community_crews_challenges.sql`
- `apps/web/src/lib/coaching/community-crews.ts`, `community-challenges.ts`
- `apps/web/src/app/actions/community.ts`
- `apps/web/src/components/coaching/crew-panel.tsx`, `weekly-challenge-card.tsx`, `crew-wins-feed.tsx`, `share-recap-button.tsx`
- `apps/web/src/components/community/community-page-client.tsx`, `community-join-client.tsx`
- `apps/web/src/app/(app)/community/join/page.tsx`
- `docs/community-expansion-plan.md`, `docs/PROGRESS.md`, `docs/supabase-setup.md`

---

### 2026-06-08 — Doc sync + community on Pro tier

**What was done:**
- Confirmed `gamification` gate is **Pro** in `gates.ts` (already correct)
- Updated `TIER-GATES.md`, `BIBLE.md`, `08-gamification.md`, `07-integrations.md`, `README.md`, `supabase-setup.md`
- Added `docs/community-expansion-plan.md` (Phases 1–2 shipped; 3–6 planned)
- Pro marketing highlights now include community; Pro+ no longer lists gamification

**What's next:**
1. Apply community migrations on production if not yet applied (see `community-expansion-plan.md`)
2. Phase 7 vendor unblock: Withings, Strava when ready
3. Community Phase 3 (crews & challenges) when prioritized

**Files touched:**
- `docs/community-expansion-plan.md` (new)
- `docs/TIER-GATES.md`, `docs/BIBLE.md`, `docs/PROGRESS.md`
- `docs/phases/07-integrations.md`, `docs/phases/08-gamification.md`
- `docs/supabase-setup.md`, `README.md`
- `apps/web/src/lib/billing/pricing.ts`

---

### 2026-06 — Community expansion Phases 1–2

**What was done:**
- **Phase 1:** `/community` tab, full standings, habit breakdown, rank delta on recap, pre-workout strip, auto wins, weekly recap, cheers
- **Phase 2:** Weekly rival, follow/friends board, in-app notifications, notification panel
- Migrations `20260610600000` through `20260610740000`
- Gamification tier moved to **Pro** in `gates.ts`

**Apply migrations:** see [docs/community-expansion-plan.md](./community-expansion-plan.md)

**Files touched:** `apps/web/src/lib/coaching/`, `components/coaching/`, `components/community/`, `components/home/community-section.tsx`, `app/actions/community.ts`, community migrations

---

### 2026-06-18 — Culver's restaurant menu

**What was done:**
- Added Culver's to curated Pro+ restaurant search (`restaurant-chains.ts`)
- 24 popular items: ButterBurgers, CurderBurger, chicken, cod, fries, cheese curds, chili cheddar fries, onion rings, coleslaw, George's chili, salad, custard, shake
- Macros sourced from Culver's published nutrition guide

**What's next:**
1. Apply pending migrations on production if not yet applied
2. Phase 7 vendor unblock: Withings, Garmin, Strava when ready

**Files touched:**
- `apps/web/src/lib/nutrition/restaurant-chains.ts`
- `docs/PROGRESS.md`

---

### 2026-06-12 — Phase 8 (motivation + gamification)

**What was done:**
- `@forgefit/coaching` — pre-workout hype, PR celebration copy, weekly habit score
- Migration `20260610000000_phase8_gamification.sql` — `leaderboard_entries`, `community_wins`
- Pro+ pre-workout hype banner on active workout (first step)
- Pro+ PR celebration modal (`gradient-forge-celebrate`) on set completion
- Profile gamification opt-in toggle (default off)
- Home leaderboard + community wins feed (opt-in, bucketed by goal + experience)
- Fitbit activity UI on Home + Progress (prior session)

**Apply migration:** `20260610000000_phase8_gamification.sql`

**What's next:**
1. Apply Phase 8 migration on production
2. Phase 7 vendor unblock: Withings, Garmin, Strava when ready
3. Optional: LLM-backed coaching copy behind `ai_motivation` gate

**Files touched:**
- `packages/coaching/`, `apps/web/src/lib/coaching/`, `apps/web/src/lib/activity/`
- `apps/web/src/components/coaching/`, `profile/gamification-setting.tsx`
- `apps/web/src/components/workout/active-workout.tsx`
- `supabase/migrations/20260610000000_phase8_gamification.sql`
- `docs/phases/08-gamification.md`, `docs/PROGRESS.md`, `docs/BIBLE.md`

---

### 2026-06-09 — Subscription downgrade & cancel

**What was done:**
- `POST /api/stripe/subscription/change` — Pro ↔ Pro+ on existing subscription (proration)
- `POST /api/stripe/subscription/cancel` — cancel at period end (default) or immediate
- `POST /api/stripe/subscription/resume` — undo pending cancellation
- `POST /api/stripe/portal` — Stripe Customer Portal (payment method, invoices)
- Profile UI: downgrade, cancel, resume, manage billing
- Migration `subscription_cancel_at_period_end` + sync from Stripe webhooks
- Checkout blocked when user already has active subscription (409)

**Apply migration:** `20260609600000_subscription_cancel_flag.sql`

**Stripe Dashboard:** enable Customer Portal and add all four prices to allowed products.

---

### 2026-06-09 — Stripe subscription sync fix

**What was done:**
- Fixed price ID parsing when Stripe sends `price` as a string (not expanded object)
- Added `checkout.session.completed` webhook handler + session metadata merge
- Added `POST /api/stripe/sync` fallback after checkout success (retries on Profile)
- Skip syncing `incomplete` subscriptions; resolve `user_id` from customer metadata
- Re-fetch subscription with expanded price on webhook events

**Verify on production:**
- Vercel env: `STRIPE_WEBHOOK_SECRET` = Dashboard endpoint secret (not CLI)
- Vercel env: `SUPABASE_SERVICE_ROLE_KEY` set
- Stripe webhook URL: `https://joinforgefit.com/api/stripe/webhook`
- Webhook events include `checkout.session.completed`

---

### 2026-06-09 — Pro tier features complete

**What was done:**
- Analytics lib: strength e1RM series, PR history, weekly volume, muscle breakdown, nutrition adherence, rule-based insights
- Progress tab: Pro-gated sections for insights, strength, PRs, volume, progress photos
- Nutrition tab: adherence dashboard (7/30/90d + 14-day heatmap)
- Home: Pro insights strip (top 2 insights)
- Progress photos: migration `20260609500000`, upload API, private timeline UI
- Export: CSV format (`/api/account/export?format=csv`) + Profile buttons

**What's next:**
1. Apply `20260609500000_progress_photos.sql` migration
2. End-to-end Stripe checkout test (user has keys configured)
3. Phase 7 Pro+ only: Withings, Fitbit OAuth

**Files touched:**
- `apps/web/src/lib/analytics/*`, `apps/web/src/lib/progress-photos/*`
- `apps/web/src/components/progress/*`, `nutrition/*`, `home/pro-insights-strip.tsx`
- `apps/web/src/app/api/progress-photos/*`, `apps/web/src/app/api/account/export/route.ts`
- `supabase/migrations/20260609500000_progress_photos.sql`

---

### 2026-06-09 — Phase 7 implementation (billing UI + Pro gates)

**What was done:**
- `docs/ADRs/001-tier-pricing-margins.md` + margin section in `TIER-GATES.md`
- Profile `SubscriptionSetting` — Pro / Pro+ picker, annual default, Stripe checkout
- Progress gates: 30d vs 90d horizon, confidence bands, goal date, 90-day chart cap
- `UpgradePrompt` component on Progress + export gate (API + Profile)
- Projection engine: `includeConfidenceBand` + `bandLowKg`/`bandHighKg` on points

**What's next:**
1. Apply migrations + configure Stripe (4 prices, webhook, env vars)
2. Test checkout end-to-end in Stripe test mode
3. Pro analytics UI: strength charts, volume trends, nutrition adherence
4. Progress photos (Pro)
5. Pro+ integrations (Withings, Fitbit)

**Files touched:**
- `docs/ADRs/001-tier-pricing-margins.md`, `docs/TIER-GATES.md`, `docs/phases/07-integrations.md`
- `apps/web/src/components/profile/subscription-setting.tsx`
- `apps/web/src/components/billing/upgrade-prompt.tsx`
- `apps/web/src/components/progress/*`, `apps/web/src/lib/measurements/*`
- `apps/web/src/app/(app)/profile/page.tsx`, `apps/web/src/app/api/account/export/route.ts`
- `packages/projection-engine/src/*`

---

### 2026-06-09 — Pro / Pro+ tier gates & billing schema

**What was done:**
- `docs/TIER-GATES.md` — authoritative Free / Pro ($8.99) / Pro+ ($14.99) feature matrix
- Billing lib: `gates.ts`, updated `types`, `pricing`, `stripe`, `sync-subscription`, `subscription`
- Checkout accepts `{ tier: "pro" | "pro_plus", interval }`; webhook resolves tier from Stripe price ID
- Migration `20260609400000_pro_plus_subscription_tier.sql` — adds `pro_plus` enum value
- Updated BIBLE freemium section, Phase 7 doc, `.env.example`, marketing copy

**What's next:**
1. Apply migrations `20260609300000` + `20260609400000` if not yet applied
2. Create four Stripe Prices (Pro + Pro+ × monthly + annual)
3. Profile upgrade UI (two-tier picker + checkout)
4. Wire Pro gates in Progress/Home/Nutrition (90d projections, 90-day free history cap)
5. Phase 7 Pro+ integrations (Withings, Fitbit)

**Files touched:**
- `docs/TIER-GATES.md`, `docs/BIBLE.md`, `docs/phases/07-integrations.md`, `docs/PROGRESS.md`
- `apps/web/src/lib/billing/*`, `apps/web/src/app/api/stripe/checkout/route.ts`
- `apps/web/src/lib/types/profile.ts`, `.env.example`
- `supabase/migrations/20260609400000_pro_plus_subscription_tier.sql`
- `apps/web/src/components/marketing/marketing-free-tier.tsx`

---

### 2026-06-09 — Profile one-rep maxes

**What was done:**
- Migration `user_one_rep_maxes` — user-declared 1RM per lift (stored in kg)
- Profile section: 8 compound lifts with unit-aware inputs + save/clear
- Load prescription merges profile 1RM with log-derived e1RM (logs can raise effective max)
- Workout start uses merged max for %1RM weight suggestions

**Apply migration:** `20260608700000_user_one_rep_maxes.sql`

**Files touched:**
- `supabase/migrations/20260608700000_user_one_rep_maxes.sql`
- `apps/web/src/lib/progression/one-rep-max-lifts.ts`, `user-maxes.ts`, `one-rep-max.ts`, `rir-progression.ts`
- `apps/web/src/app/actions/one-rep-maxes.ts`
- `apps/web/src/components/profile/one-rep-max-setting.tsx`
- `apps/web/src/app/(app)/profile/page.tsx`, `workout/page.tsx`, `workout-hub.tsx`

---

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

### 2026-06-30 — Program regeneration start date

**What was done:**
- Profile → Program plan now includes **New plan starts on** date picker (today or future)
- `rebuildProgram` and save-with-regenerate pass `schedule_start_date` through to `generateAndSaveProgram`
- `ProgramPlan.scheduleStartDate` stored on generation; workout/home UI respects it for calendar labels and Start button gating
- Future start dates skip mid-week `scheduleFromTodayOnly` wrapping so sessions anchor to the chosen week

**What's next:**
- Surface upcoming plan start banner on Home when `scheduleStartDate` is in the future

**Blockers:** None

**Files touched:**
- `apps/web/src/lib/programs/start-date.ts`, `start-date.test.ts`
- `apps/web/src/components/profile/plan-schedule-start-field.tsx`
- `apps/web/src/app/actions/equipment.ts`, `progression.ts`, `program.ts`
- `apps/web/src/components/profile/equipment-setting.tsx`, `program-plan-setting.tsx`
- `apps/web/src/components/progression/experience-path-panel.tsx`
- `docs/PROGRESS.md`

---

### 2026-06-30 — Start date on equipment and promotion regenerations

**What was done:**
- Shared `PlanScheduleStartField` component and `resolveProgramStartDate` helper
- Equipment save, travel mode enter/exit, and experience promotion upgrade now accept a schedule start date when regenerating the plan
- Profile equipment UI shows the date picker when “Regenerate program with this equipment” is checked
- Experience promotion modal includes start date before confirming upgrade

**What's next:**
- Surface upcoming plan start banner on Home when `scheduleStartDate` is in the future

---

### 2026-06-30 — Functional movement prioritization

**What was done:**
- Added goal-aware functional bias to `pickExerciseForPattern` — strength/recomp/fat-loss goals prefer free-weight compounds; bodybuilding uses moderate bias on compounds and low bias on isolation fillers
- Enforced evidence-backed compound floor per session (≥2 for bodybuilding, ≥3 for general strength/powerlifting)
- Updated bodybuilding 6-day split so Arms & Core includes a horizontal pull for joint balance
- Added carry pattern to general strength and recomposition lower sessions; seeded farmer's and suitcase carries
- Added evidence-kb rules `functional_compound_floor_bodybuilding` and `functional_movement_priority_strength` (KB v0.3.2)

**What's next:**
- Consider rotation/anti-rotation patterns for advanced functional blocks
- Wire full catalog into program generation when curated seed list is insufficient

**Blockers:** None

**Files touched:**
- `packages/exercise-db/src/functional.ts`, `index.ts`, `exercises.ts`
- `packages/program-engine/src/functional.ts`, `generate.ts`, `splits.ts`, `equipment-filter.test.ts`, `functional.test.ts`
- `packages/evidence-kb/src/index.ts`, `rules-extra.ts`
- `docs/ARCHITECTURE.md`, `docs/PROGRESS.md`

---


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
