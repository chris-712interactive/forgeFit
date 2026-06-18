-- Phase 2 community: follows, weekly rivals, in-app notifications.

create table if not exists community_follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references profiles (id) on delete cascade,
  followee_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (follower_id, followee_id),
  check (follower_id <> followee_id)
);

create index if not exists community_follows_follower_idx
  on community_follows (follower_id);

create index if not exists community_follows_followee_idx
  on community_follows (followee_id);

create table if not exists community_rivals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  rival_user_id uuid not null references profiles (id) on delete cascade,
  week_start date not null,
  created_at timestamptz not null default now(),
  unique (user_id, week_start),
  check (user_id <> rival_user_id)
);

create index if not exists community_rivals_week_idx
  on community_rivals (week_start, user_id);

create table if not exists community_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  type text not null check (
    type in (
      'rank_passed',
      'close_to_pass',
      'rival_ahead',
      'rival_passed_you',
      'cheer_received',
      'follow_mutual'
    )
  ),
  title text not null,
  body text not null,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists community_notifications_user_idx
  on community_notifications (user_id, created_at desc);

create index if not exists community_notifications_unread_idx
  on community_notifications (user_id)
  where read_at is null;

alter table community_follows enable row level security;
alter table community_rivals enable row level security;
alter table community_notifications enable row level security;

create policy "Read own follow edges"
  on community_follows
  for select
  using (auth.uid() = follower_id or auth.uid() = followee_id);

create policy "Follow peers in same bucket"
  on community_follows
  for insert
  with check (
    auth.uid() = follower_id
    and exists (
      select 1
      from profiles me
      where me.id = auth.uid()
        and me.gamification_opt_in = true
    )
    and exists (
      select 1
      from profiles me
      join profiles them on them.id = followee_id
      where me.id = auth.uid()
        and me.primary_goal::text = them.primary_goal::text
        and me.experience_level::text = them.experience_level::text
    )
  );

create policy "Unfollow own edges"
  on community_follows
  for delete
  using (auth.uid() = follower_id);

create policy "Read own weekly rival"
  on community_rivals
  for select
  using (auth.uid() = user_id);

create policy "Insert own weekly rival"
  on community_rivals
  for insert
  with check (auth.uid() = user_id);

create policy "Update own weekly rival"
  on community_rivals
  for update
  using (auth.uid() = user_id);

create policy "Read own notifications"
  on community_notifications
  for select
  using (auth.uid() = user_id);

create policy "Update own notifications"
  on community_notifications
  for update
  using (auth.uid() = user_id);

create policy "Insert community notifications when opted in"
  on community_notifications
  for insert
  with check (
    exists (
      select 1
      from profiles p
      where p.id = auth.uid()
        and p.gamification_opt_in = true
    )
  );
