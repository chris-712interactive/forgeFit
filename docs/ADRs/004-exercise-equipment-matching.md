# ADR 004 — Exercise equipment matching (OR modalities + AND supports)

**Status:** Accepted  
**Date:** 2026-07-25

## Context

Fat-loss program regeneration was producing sessions with only **Incline Walk** (15–25 min) and no strength work. Root causes:

1. Curated exercises list alternative load tools as a flat array (e.g. `["dumbbells", "kettlebells"]` for goblet squat). `isExerciseAvailable` used `.every()`, so users needed **all** listed items.
2. Bodyweight movements required an explicit `bodyweight_only` inventory flag. Gym users who never ticked that box could not get push-ups, planks, or BW squats as fallbacks.
3. Fat-loss splits always append cardio when a treadmill (etc.) is present — so a failed strength pick still left a “Full Body” session that looked like a 1-minute incline walk.

## Decision

In `@forgefit/exercise-db` `isExerciseAvailable`:

- **Load modalities** (barbell, dumbbells, kettlebells, cables, machines, bands, pull-up bar, bodyweight) on an exercise are **OR** — any one match is enough.
- **Supports** (`bench`, `squat_rack`) are **AND** — all listed supports must be present.
- **`bodyweight_only` is always implied** for availability checks (you always have your body). Exclusive bodyweight-only *mode* still blocks machine-only exercises via `isBodyweightOnlyMode`.

Also:

- Dumbbell row no longer requires a bench (bent-over row).
- Added curated **Inverted Row** (`bodyweight_row`) for horizontal pull without gym gear.

## Consequences

- Fat-loss (and other) plans build real full-body strength even when inventory is treadmill-only or dumbbells-without-bench.
- Incline Walk remains a fat-loss cardio adjunct, not the whole session.
- Users with an already-generated empty plan must **regenerate** (Profile → Program plan, or equipment save with regenerate) to pick up the fix.
