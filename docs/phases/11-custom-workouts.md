# Phase 11 — Custom Workouts

**Status:** Code complete — awaiting Supabase migration apply  
**Depends on:** Phase 3 (workout logging), Phase 7 (Pro gates)

## Goal

Pro/Pro+ users can build, log, save, import, and export custom workouts using equipment-aware exercise picks from `@forgefit/exercise-db`. Program-engine is not involved.

## Gating

| Capability | Tier | Gate key |
|------------|------|----------|
| Custom workout builder & logging | Pro, Pro+ | `custom_workouts` |
| Saved templates | Pro, Pro+ | `custom_workouts` |
| CSV import (native ForgeRep format) | Pro, Pro+ | `workout_import` |
| CSV export (completed sessions) | Pro, Pro+ | `data_export` |

Free tier: upgrade prompt on Workout hub only — no templates on free.

## Done When

- [x] `session_source` on `workout_sessions` + `user_workout_templates` migration
- [x] Dexie v5: `sessionSource` on sessions, `workoutTemplates` table
- [x] Custom builder UI with equipment filter
- [x] Optional warmup presets on custom workouts
- [x] `POST /api/workouts/import` (native CSV, Pro gate)
- [x] `GET /api/workouts/export` + history per-session CSV (Pro `data_export`)
- [x] `GET/POST/DELETE /api/workout-templates`
- [x] Custom sessions excluded from week plan `buildDayStatusMap`
- [ ] Migration `20260714120000_custom_workouts.sql` applied in Supabase (ops — required before marking phase Complete)
- [ ] Migration `20260714210000_workout_day_assignments.sql` applied in Supabase (ops)
- [ ] Migration `20260730120000_program_week_clears.sql` applied in Supabase (ops)
- [x] Assign templates to calendar days (today/future) with Replace vs Keep both
- [x] Assigned customs appear on Workout hub and are startable
- [x] Clear active plan week (hide program workouts) and optionally assign custom replacements
- [x] Restore cleared week to show generated program again
- [x] Unit tests for CSV parser + session source
- [x] `pnpm turbo typecheck` passes

## Day assignment

Pro users can **Assign to a day** from the custom builder (saves template if needed). If that date already has a program or custom workout, choose:

- **Replace** — hide the program card for that date; clear other customs on that date
- **Keep both** — show program + custom side by side

Schema: `user_workout_day_assignments` (`template_id`, `scheduled_date`, `replaces_program`). See migration `20260714210000_workout_day_assignments.sql`.

## Clear week for customs

Pro users can **Clear week for customs** on the Workout hub “This week” section:

1. Hides all program workouts for the active plan week (`user_program_week_clears`)
2. Optionally assigns saved templates to those dates (with `replaces_program`)
3. **Restore program week** removes the clear so generated sessions reappear

Does not delete the generated program JSON or schedule overrides. Generated plan remains available after restore.

Schema: `user_program_week_clears` (`program_id`, `week_start_date`). See migration `20260730120000_program_week_clears.sql`.

Interval protocols (density / tabata / superset blocks), gym-loud timers, and Gravity packs live in **Phase 13** — see [13-interval-protocols.md](./13-interval-protocols.md) (CSV v2).

## CSV formats

**Template import** (`# forgerep-workout-template v1`):

```csv
workout_name,Custom Upper
exercise_id,barbell_bench_press_medium_grip
exercise_name,Barbell Bench Press
sets,4
reps,8-10
rest_seconds,120
```

**Completed export** (`# forgerep-workout-log v1`): per-session blocks with set rows.

## Files

- `supabase/migrations/20260714120000_custom_workouts.sql`
- `supabase/migrations/20260714210000_workout_day_assignments.sql`
- `supabase/migrations/20260730120000_program_week_clears.sql`
- `packages/offline-sync/src/types.ts`, `db.ts`, `workout-store.ts`, `template-store.ts`, `day-assignment-*`
- `apps/web/src/lib/workouts/session-source.ts`, `workout-csv-parser.ts`, `export-csv.ts`, `custom-warmup.ts`, `day-assignments.ts`, `week-clears-*.ts`
- `apps/web/src/components/workout/custom-workout-*.tsx`, `assign-custom-workout-sheet.tsx`, `assigned-custom-workout-card.tsx`, `clear-week-sheet.tsx`
- `apps/web/src/app/api/workouts/import|export`, `api/workout-templates`, `api/workout-day-assignments`, `api/workout-week-clears`
