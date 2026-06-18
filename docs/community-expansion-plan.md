# Community Expansion Plan

> Adoption-focused competition layer — MapMyRun-style visible rivalry, fair buckets, and weekly urgency.  
> **Phases 1–2** are implemented. Phases 3–6 are planned.

Tier gate: **Pro** (`gamification` in `gates.ts`). Free users can preview bucket stats before opt-in; Pro unlocks full participation.

---

## North star

**Weekly active community participants (WACP):** Pro users who opt in *and* take at least one community action per week (scored workout, cheer, follow, or rival interaction).

---

## Current state (Phases 1–2 — shipped)

| Feature | Location | Migration |
|---------|----------|-----------|
| Always-visible Community section on Home | `community-section.tsx` | — |
| `/community` tab (bottom nav) | `community/page.tsx` | — |
| Full bucket standings (50) + habit score breakdown | `community-page-client.tsx` | `20260610000000_phase8_gamification.sql` |
| Pre-workout rank strip | `community-rank-strip.tsx` | — |
| Post-workout rank delta card | `workout-rank-delta-card.tsx` | — |
| Auto-published wins (`weekly_plan`, `streak`, PR) | `service.ts`, gamification actions | `20260610000000` |
| Win cheers | `community-win-cheer-button.tsx` | `20260610600000_community_win_cheers.sql` |
| Weekly in-app recap (Mon/Tue) | `weekly-community-recap-card.tsx` | — |
| Weekly rival matching | `rival-matching.ts`, `weekly-rival-card.tsx` | `20260610700000_community_social.sql` |
| Follow / friends board | `community-follow-button.tsx`, `friends-leaderboard.tsx` | `20260610700000`, RLS fixes `10710000`/`10730000` |
| In-app notifications (passed, close to pass, rival, cheer, mutual follow) | `community-notifications-panel.tsx` | `20260610700000`, update RLS `10740000` |
| Mark read / mark all read | `community.ts` actions | — |

**Scoring:** Habit score 0–100 — training 40 / protein 35 / quality 25. Buckets by goal × experience.

**Privacy:** First name only on leaderboard; opt-in defaults off (`gamification_opt_in` on profiles).

---

## Phase 1 — Clear competition ✅ Shipped

- Dedicated `/community` page with full leaderboard
- Transparent habit score breakdown
- Rank delta on post-workout recap
- Auto-publish `weekly_plan` and `streak` milestones
- Pre-workout rank strip
- Weekly in-app recap (“Last week you finished #4…”)
- **Not yet:** weekly email recap; metrics instrumentation (WACP, opt-in funnel)

---

## Phase 2 — Named rivals ✅ Shipped

- Rival matching algorithm (±3 ranks or ±5 habit points)
- Weekly Rival card on Home, Community, pre-workout
- “Points to pass” callout
- In-app notifications (passed, close to pass, rival events, cheer, mutual follow)
- Follow model + mutual friends mini-leaderboard
- **Not yet:** metrics targets / analytics dashboard

---

## Phase 3 — Crews & challenges (planned)

- Crew create/join/invite link (3–8 members)
- Weekly bucket challenge engine + progress UI
- Crew shared goal + crew feed filter
- Shareable weekly recap card

---

## Phase 4 — Push & loops (planned)

- Web Push subscription + notification preferences
- Rival activity + cheer received pushes
- Sunday “final hours” nudge

---

## Phase 5 — Leagues & seasons (planned)

- Monthly league tiers within bucket (Bronze / Silver / Gold)
- Promotion/relegation + persistent badges
- Season recap + bucket hall of fame

---

## Phase 6 — Scale & polish (planned)

- Feed reactions/comments (preset only)
- Anti-gaming heuristics
- Admin moderation tools
- A/B test default-on opt-in with clear privacy copy

---

## Production migrations (community, in order)

1. `20260610000000_phase8_gamification.sql`
2. `20260610600000_community_win_cheers.sql`
3. `20260610700000_community_social.sql`
4. `20260610710000_community_follows_rls_fix.sql` (superseded by 10730000 if re-run)
5. `20260610730000_community_follows_rls_leaderboard.sql` — **required for follow buttons**
6. `20260610740000_community_notifications_update_rls.sql` — individual mark-read UPDATE policy

---

## References

- Phase 8 base: [docs/phases/08-gamification.md](./phases/08-gamification.md)
- Tier gates: [docs/TIER-GATES.md](./TIER-GATES.md)
- Fitbit cross-pillar scorecard: [docs/fitbit-expansion-plan.md](./fitbit-expansion-plan.md)
