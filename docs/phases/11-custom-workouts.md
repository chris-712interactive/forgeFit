# Phase 11 — Custom Workouts

**Status:** In progress  
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
- [ ] Migration `20260714120000_custom_workouts.sql` applied in Supabase
- [x] Unit tests for CSV parser + session source
- [x] `pnpm turbo typecheck` passes

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

Interval protocols (density / tabata / superset blocks), gym-loud timers, and Gravity packs live in **Phase 13** — see [13-interval-protocols.md](./13-interval-protocols.md) (CSV v2).

**Completed export** (`# forgerep-workout-log v1`): per-session blocks with set rows.

## Files

- `supabase/migrations/20260714120000_custom_workouts.sql`
- `packages/offline-sync/src/types.ts`, `db.ts`, `workout-store.ts`, `template-store.ts`
- `apps/web/src/lib/workouts/session-source.ts`, `workout-csv-parser.ts`, `export-csv.ts`, `custom-warmup.ts`
- `apps/web/src/components/workout/custom-workout-*.tsx`
- `apps/web/src/app/api/workouts/import|export`, `api/workout-templates`
