-- Phase 8: opt-in gamification — weekly leaderboard scores and community wins feed.

create table if not exists leaderboard_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  bucket_goal text not null,
  bucket_experience text not null,
  week_start date not null,
  habit_score integer not null default 0 check (habit_score >= 0 and habit_score <= 100),
  display_label text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, week_start)
);

create index if not exists leaderboard_entries_bucket_week_idx
  on leaderboard_entries (bucket_goal, bucket_experience, week_start desc, habit_score desc);

create table if not exists community_wins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  win_type text not null check (win_type in ('pr', 'weekly_plan', 'streak')),
  headline text not null,
  detail text,
  bucket_goal text not null,
  bucket_experience text not null,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists community_wins_bucket_time_idx
  on community_wins (bucket_goal, bucket_experience, occurred_at desc);

alter table leaderboard_entries enable row level security;
alter table community_wins enable row level security;

create policy "Read leaderboard in same bucket"
  on leaderboard_entries
  for select
  using (
    bucket_goal = (
      select primary_goal::text from profiles where id = auth.uid()
    )
    and bucket_experience = (
      select experience_level::text from profiles where id = auth.uid()
    )
  );

create policy "Users insert own leaderboard row"
  on leaderboard_entries
  for insert
  with check (auth.uid() = user_id);

create policy "Users update own leaderboard row"
  on leaderboard_entries
  for update
  using (auth.uid() = user_id);

create policy "Read community wins in same bucket"
  on community_wins
  for select
  using (
    bucket_goal = (
      select primary_goal::text from profiles where id = auth.uid()
    )
    and bucket_experience = (
      select experience_level::text from profiles where id = auth.uid()
    )
  );

create policy "Users insert own community wins"
  on community_wins
  for insert
  with check (auth.uid() = user_id);
