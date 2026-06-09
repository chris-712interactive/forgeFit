# Phase 2 — Evidence Engine + Program Generation

**Status:** Complete (2026-06-08)  
**Depends on:** Phase 1

## Goal

`program-engine` reads `evidence-kb` + user profile → `ProgramPlan` JSON.

## Deliverables

- `packages/program-engine` with 5 goal templates × 3 experience levels
- 30 evidence rules in YAML + loader
- `/api/programs/generate` endpoint
- Dashboard showing current week schedule

## Done When

- [x] Program respects equipment + time budget
- [x] Every recommendation traces to a cited rule (`appliedRuleIds` + per-session `citationRuleIds`)
- [x] Dashboard displays generated week plan (`WeekSchedule` on `/home`)
- [x] `pnpm turbo typecheck build` passes
- [ ] Migration `20260608180000_phase2_programs.sql` applied in Supabase (user action)
