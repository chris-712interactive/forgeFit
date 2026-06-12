# Phase 8 — Motivation + Gamification

**Status:** In progress (2026-06-12)  
**Depends on:** Phase 7

## Goal

Pro+ coaching triggers, opt-in leaderboards, community win feed.

Tier gates: [docs/TIER-GATES.md](../TIER-GATES.md) — AI motivation, gamification, and PR celebration are **Pro+ only**. Pro gets templated PR badges.

## Done When

- [x] Pre-workout hype message displays (Pro+ — `@forgefit/coaching` rule-based copy)
- [x] PR triggers celebration modal (`gradient-forge-celebrate`)
- [x] Gamification opt-in defaults off (Profile toggle)
- [x] Leaderboard buckets by goal + experience
- [x] Community win feed (PR posts when opted in)

## Notes

- Coaching copy is **deterministic** (goal, experience, session, why-started) — no LLM API yet; gate key remains `ai_motivation` for future upgrade.
- Apply migration `20260610000000_phase8_gamification.sql` for leaderboard + win feed tables.
