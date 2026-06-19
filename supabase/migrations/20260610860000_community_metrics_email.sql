-- Community metrics (WACP events) + weekly recap email preferences.

create table if not exists community_action_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  action_type text not null check (
    action_type in (
      'score_upsert',
      'cheer',
      'follow',
      'reaction',
      'comment',
      'opt_in'
    )
  ),
  week_start date not null,
  created_at timestamptz not null default now()
);

create index if not exists community_action_events_week_user_idx
  on community_action_events (week_start, user_id);

create index if not exists community_action_events_user_week_idx
  on community_action_events (user_id, week_start desc);

create index if not exists community_action_events_week_action_idx
  on community_action_events (week_start, action_type);

create table if not exists community_email_preferences (
  user_id uuid primary key references profiles (id) on delete cascade,
  weekly_recap boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists community_email_sends (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  week_start date not null,
  kind text not null check (kind in ('weekly_recap')),
  sent_at timestamptz not null default now(),
  unique (user_id, week_start, kind)
);

create index if not exists community_email_sends_week_idx
  on community_email_sends (week_start desc);

alter table community_action_events enable row level security;
alter table community_email_preferences enable row level security;
alter table community_email_sends enable row level security;

create policy "Users read own community action events"
  on community_action_events
  for select
  using (auth.uid() = user_id);

create policy "Read own email preferences"
  on community_email_preferences
  for select
  using (auth.uid() = user_id);

create policy "Insert own email preferences"
  on community_email_preferences
  for insert
  with check (auth.uid() = user_id);

create policy "Update own email preferences"
  on community_email_preferences
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users read own email sends"
  on community_email_sends
  for select
  using (auth.uid() = user_id);
