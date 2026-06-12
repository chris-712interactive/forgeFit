-- Phase 7: OAuth device integrations (Pro+)

create type integration_provider as enum ('withings', 'fitbit', 'strava');

create table user_integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  provider integration_provider not null,
  external_user_id text,
  access_token_encrypted text not null,
  refresh_token_encrypted text,
  token_expires_at timestamptz,
  scopes text,
  status text not null default 'active'
    check (status in ('active', 'revoked', 'error')),
  last_sync_at timestamptz,
  last_sync_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

create index user_integrations_user_id_idx on user_integrations (user_id);

alter table user_integrations enable row level security;

create policy "Users read own integrations"
  on user_integrations for select
  using (auth.uid() = user_id);

create policy "Users delete own integrations"
  on user_integrations for delete
  using (auth.uid() = user_id);
