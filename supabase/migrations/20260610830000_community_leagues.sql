-- Phase 5 community: monthly league tiers, season results, badges, hall of fame.

create table if not exists community_league_tiers (
  user_id uuid primary key references profiles (id) on delete cascade,
  bucket_goal text not null,
  bucket_experience text not null,
  tier text not null default 'bronze' check (tier in ('bronze', 'silver', 'gold')),
  updated_at timestamptz not null default now()
);

create index if not exists community_league_tiers_bucket_tier_idx
  on community_league_tiers (bucket_goal, bucket_experience, tier);

create table if not exists community_season_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  bucket_goal text not null,
  bucket_experience text not null,
  season_month date not null,
  tier_at_start text not null check (tier_at_start in ('bronze', 'silver', 'gold')),
  tier_at_end text not null check (tier_at_end in ('bronze', 'silver', 'gold')),
  weeks_scored integer not null default 0 check (weeks_scored >= 0),
  avg_habit_score numeric(5, 2),
  avg_rank numeric(6, 2),
  best_rank integer,
  promoted boolean not null default false,
  relegated boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, season_month)
);

create index if not exists community_season_results_bucket_idx
  on community_season_results (bucket_goal, bucket_experience, season_month desc);

create table if not exists community_season_hof (
  id uuid primary key default gen_random_uuid(),
  season_month date not null,
  bucket_goal text not null,
  bucket_experience text not null,
  rank integer not null check (rank between 1 and 3),
  user_id uuid not null references profiles (id) on delete cascade,
  display_label text not null,
  avg_habit_score numeric(5, 2) not null,
  created_at timestamptz not null default now(),
  unique (season_month, bucket_goal, bucket_experience, rank)
);

create index if not exists community_season_hof_bucket_idx
  on community_season_hof (bucket_goal, bucket_experience, season_month desc);

create table if not exists community_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  badge_key text not null check (
    badge_key in (
      'league_silver',
      'league_gold',
      'season_champion',
      'season_podium',
      'season_promoted'
    )
  ),
  season_month date,
  earned_at timestamptz not null default now(),
  unique (user_id, badge_key, season_month)
);

create index if not exists community_badges_user_idx
  on community_badges (user_id, earned_at desc);

alter table community_league_tiers enable row level security;
alter table community_season_results enable row level security;
alter table community_season_hof enable row level security;
alter table community_badges enable row level security;

-- League tiers: read peers in same bucket; write own row.
create policy "Read league tiers in same bucket"
  on community_league_tiers
  for select
  using (
    exists (
      select 1
      from profiles me
      where me.id = auth.uid()
        and me.primary_goal::text = community_league_tiers.bucket_goal
        and me.experience_level::text = community_league_tiers.bucket_experience
    )
  );

create policy "Upsert own league tier"
  on community_league_tiers
  for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from profiles me
      where me.id = auth.uid()
        and me.gamification_opt_in = true
        and me.primary_goal::text = bucket_goal
        and me.experience_level::text = bucket_experience
    )
  );

create policy "Update own league tier"
  on community_league_tiers
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Season results: read own + same-bucket peers.
create policy "Read season results in same bucket"
  on community_season_results
  for select
  using (
    auth.uid() = user_id
    or exists (
      select 1
      from profiles me
      where me.id = auth.uid()
        and me.primary_goal::text = community_season_results.bucket_goal
        and me.experience_level::text = community_season_results.bucket_experience
    )
  );

-- Hall of fame: read entries in viewer's bucket.
create policy "Read hall of fame in same bucket"
  on community_season_hof
  for select
  using (
    exists (
      select 1
      from profiles me
      where me.id = auth.uid()
        and me.primary_goal::text = community_season_hof.bucket_goal
        and me.experience_level::text = community_season_hof.bucket_experience
    )
  );

-- Badges: read own + same-bucket peers.
create policy "Read badges in same bucket"
  on community_badges
  for select
  using (
    auth.uid() = user_id
    or exists (
      select 1
      from profiles me
      join community_league_tiers lt on lt.user_id = community_badges.user_id
      where me.id = auth.uid()
        and me.primary_goal::text = lt.bucket_goal
        and me.experience_level::text = lt.bucket_experience
    )
  );

-- Extend notification types for league events.
alter table community_notifications drop constraint if exists community_notifications_type_check;

alter table community_notifications add constraint community_notifications_type_check
  check (
    type in (
      'rank_passed',
      'close_to_pass',
      'rival_ahead',
      'rival_passed_you',
      'cheer_received',
      'follow_mutual',
      'league_promoted',
      'league_relegated',
      'season_champion'
    )
  );
