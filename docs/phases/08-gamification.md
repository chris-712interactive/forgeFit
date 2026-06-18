# Phase 8 — Motivation + Gamification

**Status:** Complete (2026-06-12) · Community Phases 1–2 shipped (2026-06)  
**Depends on:** Phase 7

## Goal

Pro coaching/community surfaces; Pro+ AI coaching and PR celebration UX.

Tier gates: [docs/TIER-GATES.md](../TIER-GATES.md)

| Feature | Tier |
|---------|------|
| Opt-in leaderboards, win feed, rivals, follows, notifications | **Pro** (`gamification`) |
| Pre-workout hype copy | **Pro+** (`ai_motivation`) |
| PR celebration modal | **Pro+** (`pr_celebration`) |
| Templated PR badges | **Pro** (`pr_history`) |

Community expansion roadmap: [docs/community-expansion-plan.md](../community-expansion-plan.md)

## Done When

- [x] Pre-workout hype message displays (Pro+ — `@forgefit/coaching` rule-based copy)
- [x] PR triggers celebration modal (`gradient-forge-celebrate`) (Pro+)
- [x] Gamification opt-in defaults off (Profile toggle)
- [x] Leaderboard buckets by goal + experience (Pro)
- [x] Community win feed + cheers (Pro)
- [x] `/community` tab, rank delta, habit breakdown, weekly recap (Community Phase 1)
- [x] Weekly rival, follows, in-app notifications (Community Phase 2)
- [x] Crews, bucket challenges, crew feed, share recap (Community Phase 3)

## Migrations

| Migration | Purpose |
|-----------|---------|
| `20260610000000_phase8_gamification.sql` | `leaderboard_entries`, `community_wins` |
| `20260610600000_community_win_cheers.sql` | Win cheers |
| `20260610700000_community_social.sql` | Follows, rivals, notifications |
| `20260610730000_community_follows_rls_leaderboard.sql` | Follow RLS fix |
| `20260610740000_community_notifications_update_rls.sql` | Notification mark-read RLS |
| `20260610800000_community_crews_challenges.sql` | Crews + weekly challenge tracking |

## Notes

- Coaching copy is **deterministic** (goal, experience, session, why-started) — no LLM API yet; gate key remains `ai_motivation` for future upgrade.
- Community preview (bucket stats before opt-in) is visible to Pro users; free users see upgrade prompt.
