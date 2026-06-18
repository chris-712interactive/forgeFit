-- Phase 3 community: crews, weekly bucket challenges, challenge completion tracking.

create table if not exists community_crews (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) >= 2 and char_length(name) <= 40),
  invite_code text not null unique,
  owner_id uuid not null references profiles (id) on delete cascade,
  bucket_goal text not null,
  bucket_experience text not null,
  created_at timestamptz not null default now()
);

create index if not exists community_crews_bucket_idx
  on community_crews (bucket_goal, bucket_experience);

create index if not exists community_crews_invite_code_idx
  on community_crews (invite_code);

create table if not exists community_crew_members (
  id uuid primary key default gen_random_uuid(),
  crew_id uuid not null references community_crews (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  role text not null check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  unique (crew_id, user_id),
  unique (user_id)
);

create index if not exists community_crew_members_crew_idx
  on community_crew_members (crew_id);

create table if not exists community_weekly_challenge_status (
  user_id uuid not null references profiles (id) on delete cascade,
  week_start date not null,
  bucket_goal text not null,
  bucket_experience text not null,
  challenge_key text not null check (
    challenge_key in ('plan_completion', 'quality_sessions', 'protein_days')
  ),
  progress_value numeric not null default 0,
  target_value numeric not null,
  completed boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, week_start)
);

create index if not exists community_weekly_challenge_bucket_idx
  on community_weekly_challenge_status (
    bucket_goal,
    bucket_experience,
    week_start,
    completed
  );

alter table community_crews enable row level security;
alter table community_crew_members enable row level security;
alter table community_weekly_challenge_status enable row level security;

-- Crews: members read their crew; same-bucket users can read for join preview.
create policy "Read crews in same bucket"
  on community_crews
  for select
  using (
    exists (
      select 1
      from profiles me
      where me.id = auth.uid()
        and me.primary_goal::text = bucket_goal
        and me.experience_level::text = bucket_experience
    )
  );

create policy "Create crew when opted in"
  on community_crews
  for insert
  with check (
    auth.uid() = owner_id
    and exists (
      select 1
      from profiles me
      where me.id = auth.uid()
        and me.gamification_opt_in = true
        and me.primary_goal::text = bucket_goal
        and me.experience_level::text = bucket_experience
    )
    and not exists (
      select 1
      from community_crew_members m
      where m.user_id = auth.uid()
    )
  );

create policy "Owner deletes crew"
  on community_crews
  for delete
  using (auth.uid() = owner_id);

create policy "Read crew members in shared crew"
  on community_crew_members
  for select
  using (
    exists (
      select 1
      from community_crew_members mine
      where mine.crew_id = community_crew_members.crew_id
        and mine.user_id = auth.uid()
    )
  );

create policy "Join crew when opted in and same bucket"
  on community_crew_members
  for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from profiles me
      where me.id = auth.uid()
        and me.gamification_opt_in = true
    )
    and exists (
      select 1
      from community_crews c
      join profiles me on me.id = auth.uid()
      where c.id = crew_id
        and c.bucket_goal = me.primary_goal::text
        and c.bucket_experience = me.experience_level::text
    )
    and (
      select count(*)::int
      from community_crew_members existing
      where existing.crew_id = community_crew_members.crew_id
    ) < 8
    and not exists (
      select 1
      from community_crew_members other
      where other.user_id = auth.uid()
    )
  );

create policy "Leave own crew membership"
  on community_crew_members
  for delete
  using (auth.uid() = user_id);

create policy "Read challenge status in same bucket"
  on community_weekly_challenge_status
  for select
  using (
    bucket_goal = (
      select primary_goal::text from profiles where id = auth.uid()
    )
    and bucket_experience = (
      select experience_level::text from profiles where id = auth.uid()
    )
  );

create policy "Upsert own challenge status"
  on community_weekly_challenge_status
  for insert
  with check (auth.uid() = user_id);

create policy "Update own challenge status"
  on community_weekly_challenge_status
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
