-- Backfill league tier rows for opted-in users who scored before Phase 5.

insert into community_league_tiers (user_id, bucket_goal, bucket_experience, tier)
select distinct
  p.id,
  p.primary_goal::text,
  p.experience_level::text,
  'bronze'
from profiles p
where p.gamification_opt_in = true
  and p.primary_goal is not null
  and p.experience_level is not null
on conflict (user_id) do nothing;
