# Phase 3 — Workout Tracking + Offline PWA

**Status:** Complete (2026-06-08)  
**Depends on:** Phase 2

## Goal

Active workout UI, sets/reps/RIR logging, Serwist + Dexie offline sync.

## Done When

- [x] User completes workout fully offline (Dexie in `@forgefit/offline-sync`)
- [x] Reconnect syncs sets to Supabase via `POST /api/sync` (idempotent `client_id` upserts)
- [x] Rest timer uses `forge-gold` pulse (`.rest-timer-pulse` in globals.css)
- [x] Serwist service worker precaches app shell, `/workout`, `/home`, `/~offline`
- [x] `pnpm turbo typecheck build` passes
- [ ] Migration `20260608200000_phase3_workouts.sql` applied in Supabase (user action)
