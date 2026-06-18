# Supabase Setup

## 1. Create project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Copy **Project URL** and **anon public** key from Settings → API.

## 2. Environment

```bash
cp .env.example apps/web/.env.local
# Edit apps/web/.env.local with your URL and anon key
```

## 3. Run migrations

Install [Supabase CLI](https://supabase.com/docs/guides/cli) and link your project:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

Or paste SQL from `supabase/migrations/` into the SQL Editor **in filename order**.

### Core MVP (Phases 1–6)

1. `20260608160000_phase1_profiles_onboarding.sql`
2. `20260608180000_phase2_programs.sql`
3. `20260608200000_phase3_workouts.sql`
4. `20260608300000_phase4_nutrition.sql`
5. `20260608400000_phase5_measurements.sql`
6. `20260608500000_profile_unit_system.sql`
7. `20260608600000_experience_promotion.sql`
8. `20260608700000_user_one_rep_maxes.sql`
9. `20260608800000_equipment_travel_mode.sql`
10. `20260608900000_timed_duration_fields.sql`
11. `20260609000000_workout_recovery.sql`
12. `20260609100000_workout_warmup.sql`
13. `20260609200000_health_disclaimer.sql`

### Billing & Pro analytics (Phase 7)

14. `20260609300000_pro_subscriptions.sql`
15. `20260609400000_pro_plus_subscription_tier.sql`
16. `20260609500000_progress_photos.sql`
17. `20260609600000_subscription_cancel_flag.sql`

### Integrations (Phase 7 Pro+)

18. `20260609700000_user_integrations.sql`
19. `20260609800000_daily_activity_logs.sql`
20. `20260609900000_external_activity_logs.sql`
21. `20260610100000_profile_name_and_date_of_birth.sql`
22. `20260610200000_daily_sleep_logs.sql`
23. `20260610300000_daily_recovery_logs.sql`
24. `20260610400000_daily_activity_extended.sql`
25. `20260610500000_workout_device_metrics.sql`

### Gamification & community (Phase 8 + expansion)

26. `20260610000000_phase8_gamification.sql`
27. `20260610600000_community_win_cheers.sql`
28. `20260610700000_community_social.sql`
29. `20260610710000_community_follows_rls_fix.sql`
30. `20260610730000_community_follows_rls_leaderboard.sql` — **required for follow buttons**
31. `20260610740000_community_notifications_update_rls.sql` — individual mark-read
32. `20260610800000_community_crews_challenges.sql` — crews + weekly challenges

## 4. Auth providers

**Authentication → Providers:**

- Enable **Email** (confirm email optional for dev)
- Enable **Google** — add OAuth client ID/secret from Google Cloud Console

**Authentication → URL Configuration:**

- Site URL: `http://localhost:3000`
- Redirect URLs: `http://localhost:3000/auth/callback`

## 5. Verify

```bash
pnpm dev
```

1. Visit `/signup` → create account
2. Complete 7-step onboarding
3. Land on `/home` with bottom nav and generated week schedule + macro targets
4. (Optional) Apply Stripe + integration env vars per `.env.example` for Pro billing and Fitbit
