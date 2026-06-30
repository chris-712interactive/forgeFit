-- Phase 9A (part 2): sport profile fields + parent consent.
-- Depends on 20260630110000_youth_sport_enum.sql (sport_performance enum value).

create type public.sport_season_phase as enum (
  'in_season',
  'off_season',
  'general_prep'
);

alter table public.profiles
  add column if not exists sport_id text,
  add column if not exists sport_position_id text,
  add column if not exists sport_season_phase public.sport_season_phase,
  add column if not exists secondary_goal public.fitness_goal,
  add column if not exists parent_consent_at timestamptz,
  add column if not exists parent_consent_name text,
  add column if not exists parent_consent_email text;

alter table public.profiles
  drop constraint if exists profiles_secondary_goal_not_sport;

alter table public.profiles
  add constraint profiles_secondary_goal_not_sport
  check (secondary_goal is null or secondary_goal <> 'sport_performance'::public.fitness_goal);

comment on column public.profiles.sport_id is
  'US sport catalog id when primary_goal is sport_performance.';
comment on column public.profiles.sport_position_id is
  'Position within sport when position affects programming.';
comment on column public.profiles.sport_season_phase is
  'In-season vs off-season periodization context.';
comment on column public.profiles.secondary_goal is
  'Optional physique/strength emphasis when training for sport.';
comment on column public.profiles.parent_consent_at is
  'Timestamp when parent/guardian acknowledged use for ages 13-15.';
