# Phase 5 — Measurements + Projections

**Status:** Complete  
**Depends on:** Phase 4

## Goal

Measurement history, caliper BF%, 30-day projection charts.

## Done When

- [x] Trend charts for weight + optional measurements
- [x] Jackson-Pollock caliper calculator works
- [x] 30-day projection renders < 500ms

## Delivered

- [x] `@forgefit/projection-engine` — Jackson-Pollock 3/7-site, evidence-capped weight projection, trend series builder
- [x] Migration `20260608400000_phase5_measurements.sql` — `body_measurements`, `caliper_measurements`, `projections` + RLS
- [x] `POST /api/measurements` — log weight, waist, optional circumferences (upsert by date)
- [x] `POST /api/measurements/caliper` — caliper BF% + sync to body log
- [x] Progress tab — trend chart, 30-day projection chart, log form, caliper calculator

## Verify

1. Apply migration `20260608400000_phase5_measurements.sql`
2. Open `/progress` — onboarding baseline appears if no logs yet
3. Log weight twice on different dates — trend + projection update
4. Run Jackson-Pollock 3-site — body fat % saves and appears on trend
