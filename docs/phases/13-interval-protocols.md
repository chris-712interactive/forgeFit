# Phase 13 — Interval Protocols + Gravity Pack

**Status:** In progress  
**Depends on:** Phase 11 (custom workouts), Phase 12 (deadline timers)

## Goal

Pro users can attach interval protocols to custom workouts (density, tabata, superset time-blocks), run gym-loud auto-advancing timers while logging weight/reps, and install Gravity Transformations Week 1 as seeded templates.

## Gating

| Capability | Tier | Gate key |
|------------|------|----------|
| Interval protocols on custom templates/sessions | Pro, Pro+ | `custom_workouts` |
| Gravity Week 1 install CTA | Pro, Pro+ | `custom_workouts` |
| CSV v2 with protocol fields | Pro, Pro+ | `workout_import` |

## Protocols

| Mode | Example | Behavior |
|------|---------|----------|
| `density` | 30s / 45s × 4 | Work → rest per round, per exercise |
| `tabata` | 10s / 10s × 10 + 45s between | Intervals per exercise, then between-exercise rest |
| `superset_block` | 5 min / 2 min | Timed work on pair (`groupId`), then pair rest |

## Done When

- [x] `IntervalProtocol` + `groupId` on templates/sessions (offline-sync)
- [x] Supabase `interval_protocol` JSONB on `user_workout_templates`
- [x] `IntervalTimer` + `ActiveTimerKind: "interval"` persistence (Phase 12 deadlines)
- [x] Gym-loud cue pack (work/rest/complete + 3s countdown ticks)
- [x] Builder protocol picker + CSV v2
- [x] Gravity Week 1 pack install on Workout hub (idempotent)
- [x] Unit tests for interval state machine + CSV v2
- [ ] Migration `20260714200000_interval_protocol.sql` applied in Supabase
- [x] `pnpm typecheck` passes (web + offline-sync)

## Files

- `packages/offline-sync/src/types.ts`, `template-store.ts`, `workout-store.ts`
- `supabase/migrations/20260714200000_interval_protocol.sql`
- `apps/web/src/lib/workouts/interval-protocol.ts`
- `apps/web/src/lib/audio/timer-sounds.ts`, `timer-feedback.ts`
- `apps/web/src/components/workout/interval-timer.tsx`, `active-workout.tsx`, `custom-workout-builder.tsx`, `workout-hub.tsx`
- `apps/web/src/lib/workouts/packs/gravity-week1.ts`
- `apps/web/src/lib/workouts/workout-csv-parser.ts`
- `apps/web/src/app/api/workout-templates/route.ts`
