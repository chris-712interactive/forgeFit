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

-- SECURITY DEFINER helpers avoid RLS infinite recursion on community_crew_members.
create or replace function public.is_community_crew_member(p_crew_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.community_crew_members
    where crew_id = p_crew_id
      and user_id = p_user_id
  );
$$;

create or replace function public.community_crew_member_count(p_crew_id uuid)
returns integer
language sql
security definer
set search_path = public
stable
as $$
  select count(*)::integer
  from public.community_crew_members
  where crew_id = p_crew_id;
$$;

create or replace function public.user_has_community_crew(p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.community_crew_members
    where user_id = p_user_id
  );
$$;

grant execute on function public.is_community_crew_member(uuid, uuid) to authenticated;
grant execute on function public.community_crew_member_count(uuid) to authenticated;
grant execute on function public.user_has_community_crew(uuid) to authenticated;

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
    and not public.user_has_community_crew(auth.uid())
  );

create policy "Owner deletes crew"
  on community_crews
  for delete
  using (auth.uid() = owner_id);

create policy "Read crew members in shared crew"
  on community_crew_members
  for select
  using (
    user_id = auth.uid()
    or public.is_community_crew_member(crew_id, auth.uid())
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
    and public.community_crew_member_count(crew_id) < 8
    and not public.user_has_community_crew(auth.uid())
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
