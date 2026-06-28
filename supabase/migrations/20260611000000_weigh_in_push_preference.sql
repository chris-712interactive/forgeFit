-- Weekly weigh-in reminder preference (fat loss / recomposition) + push dedupe.

alter table community_push_preferences
  add column if not exists weekly_weigh_in_nudge boolean not null default true,
  add column if not exists last_weigh_in_push_at timestamptz;
