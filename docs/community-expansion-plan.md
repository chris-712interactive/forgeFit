# Community Expansion Plan

> Adoption-focused competition layer — MapMyRun-style visible rivalry, fair buckets, and weekly urgency.  
> **Phases 1–4** are implemented. Phases 5–6 are planned.

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
| Weekly bucket challenge + crew squads | `weekly-challenge-card.tsx`, `crew-panel.tsx` | `20260610800000` |
| Crew win feed + shareable recap | `crew-wins-feed.tsx`, `share-recap-button.tsx` | — |
| Web push + preferences + Sunday nudge | `community-push-setting.tsx`, `community-push.ts` | `20260610820000` |

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

## Phase 3 — Crews & challenges ✅ Shipped

- Crew create/join via invite link (`/community/join?code=…`) — 3–8 members, one crew per user
- Weekly bucket challenge (rotates: plan completion, quality sessions, protein days)
- Personal + bucket completion counts on challenge card
- Crew shared goal: 80% of members complete the weekly challenge
- Crew-scoped win feed with cheers
- Shareable weekly recap (Web Share API + clipboard fallback)

**Migration:** `20260610800000_community_crews_challenges.sql`

**Key files:**
- `community-crews.ts`, `community-challenges.ts`
- `crew-panel.tsx`, `weekly-challenge-card.tsx`, `crew-wins-feed.tsx`, `share-recap-button.tsx`
- `app/actions/community.ts` — `createCrew`, `joinCrewByCode`, `leaveCrew`

---

## Phase 4 — Push & loops ✅ Shipped

- Web Push subscription (VAPID) + service worker handlers
- Profile notification preferences (rank passed, rival, cheer, Sunday nudge, etc.)
- In-app notification triggers also send push when enabled
- Sunday cron (`/api/cron/community-sunday-nudge`) — 10 PM UTC for final-hours nudge

**Migration:** `20260610820000_community_push.sql`

**Env:** `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `SUPABASE_SERVICE_ROLE_KEY`

**Key files:**
- `community-push.ts`, `app/actions/community-push.ts`
- `app/api/community/push/subscribe`, `app/api/community/push/vapid-key`
- `app/api/cron/community-sunday-nudge`
- `components/profile/community-push-setting.tsx`
- `app/sw.ts` — push + notificationclick handlers

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
7. `20260610800000_community_crews_challenges.sql` — crews + weekly challenge status
8. `20260610810000_community_crew_members_rls_fix.sql` — **required if crew create fails with RLS recursion**
9. `20260610820000_community_push.sql` — web push subscriptions + preferences

---

## References

- Phase 8 base: [docs/phases/08-gamification.md](./phases/08-gamification.md)
- Tier gates: [docs/TIER-GATES.md](./TIER-GATES.md)
- Fitbit cross-pillar scorecard: [docs/fitbit-expansion-plan.md](./fitbit-expansion-plan.md)
