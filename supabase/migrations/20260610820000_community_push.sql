-- Phase 4 community: web push subscriptions and notification preferences.

create table if not exists community_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists community_push_subscriptions_user_idx
  on community_push_subscriptions (user_id);

create table if not exists community_push_preferences (
  user_id uuid primary key references profiles (id) on delete cascade,
  rank_passed boolean not null default true,
  close_to_pass boolean not null default true,
  rival_events boolean not null default true,
  cheer_received boolean not null default true,
  follow_mutual boolean not null default true,
  sunday_nudge boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table community_push_subscriptions enable row level security;
alter table community_push_preferences enable row level security;

create policy "Manage own push subscriptions"
  on community_push_subscriptions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Read own push preferences"
  on community_push_preferences
  for select
  using (auth.uid() = user_id);

create policy "Insert own push preferences"
  on community_push_preferences
  for insert
  with check (auth.uid() = user_id);

create policy "Update own push preferences"
  on community_push_preferences
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
